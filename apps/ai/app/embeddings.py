"""One lazy encoder per process. Fixture mode is explicit and never a fallback."""
from collections import OrderedDict
from functools import lru_cache
import hashlib
import os
from pathlib import Path
import re
import threading
import numpy as np

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model_lock = threading.RLock()
_vector_cache: OrderedDict[tuple[str, str], np.ndarray] = OrderedDict()
_CACHE_SIZE = 256

class ModelUnavailable(RuntimeError):
    pass

def model_version() -> str:
    return f"{MODEL_NAME}@{os.getenv('MODEL_REVISION') or '1110a243fdf4706b3f48f1d95db1a4f5529b4d41'}"

@lru_cache(maxsize=1)
def get_model():
    # Caller holds the lock: concurrent first requests cannot initialize twice.
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(
            MODEL_NAME,
            revision=os.getenv("MODEL_REVISION") or "1110a243fdf4706b3f48f1d95db1a4f5529b4d41",
            cache_folder=os.getenv("MODEL_CACHE_DIR") or str(Path(__file__).resolve().parents[1] / ".model-cache"),
            local_files_only=os.getenv("ALLOW_MODEL_DOWNLOAD", "false").lower() != "true",
            trust_remote_code=False,
            device="cpu",
        )
    except Exception as exc:
        raise ModelUnavailable("Embedding model is unavailable; provision the model cache") from exc

def embed(texts: list[str], mode: str | None = None) -> np.ndarray:
    mode = mode or os.getenv("EMBEDDING_MODE", "transformer")
    if mode == "transformer":
        with _model_lock:
            version = model_version()
            keys = [(version, hashlib.sha256(t.encode()).hexdigest()) for t in texts]
            # Cache keys contain hashes, never retained complaint descriptions.
            missing = dict((key, text) for key, text in zip(keys, texts) if key not in _vector_cache)
            try:
                if missing:
                    vectors = get_model().encode(list(missing.values()), batch_size=32, normalize_embeddings=True, show_progress_bar=False, convert_to_numpy=True)
                    new_vectors = dict(zip(missing, vectors))
                else:
                    new_vectors = {}
                result = np.asarray([_vector_cache[k] if k in _vector_cache else new_vectors[k] for k in keys])
                if not np.isfinite(result).all():
                    raise ValueError("Nonfinite model output")
                for key, vector in zip(keys, result):
                    _vector_cache[key] = vector
                    _vector_cache.move_to_end(key)
                while len(_vector_cache) > _CACHE_SIZE:
                    _vector_cache.popitem(last=False)
                return result
            except ModelUnavailable:
                raise
            except Exception as exc:
                raise ModelUnavailable("Embedding inference failed") from exc
    if mode != "fixture":
        raise ValueError("EMBEDDING_MODE must be fixture or transformer")
    vectors = np.zeros((len(texts), 64), dtype=np.float64)
    for row, text in enumerate(texts):
        for word in re.findall(r"\w+", text.lower()):
            vectors[row, int.from_bytes(hashlib.sha256(word.encode()).digest()[:4], "big") % 64] += 1
    return vectors
