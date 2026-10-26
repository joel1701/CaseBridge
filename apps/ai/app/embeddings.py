"""Replaceable embedding adapter. Fixture vectors only test plumbing, not semantics."""
from functools import lru_cache
import hashlib
import os
import re
import numpy as np

@lru_cache(maxsize=1)
def get_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(
        os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"),
        local_files_only=os.getenv("ALLOW_MODEL_DOWNLOAD", "false").lower() != "true",
    )

def embed(texts: list[str], mode: str | None = None) -> np.ndarray:
    mode = mode or os.getenv("EMBEDDING_MODE", "fixture")
    if mode == "transformer":
        return np.asarray(get_model().encode(texts, normalize_embeddings=True))
    if mode != "fixture":
        raise ValueError("EMBEDDING_MODE must be fixture or transformer")
    vectors = np.zeros((len(texts), 64), dtype=np.float64)
    for row, text in enumerate(texts):
        for word in re.findall(r"\w+", text.lower()):
            bucket = int.from_bytes(hashlib.sha256(word.encode()).digest()[:4], "big") % 64
            vectors[row, bucket] += 1
    return vectors
