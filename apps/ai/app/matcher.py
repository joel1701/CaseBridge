import numpy as np
from .embeddings import embed

def cosine_similarity(left: np.ndarray, right: np.ndarray) -> float:
    left, right = np.asarray(left, dtype=float), np.asarray(right, dtype=float)
    if left.ndim != 1 or left.shape != right.shape or not np.isfinite(left).all() or not np.isfinite(right).all():
        raise ValueError("Vectors must be finite, one-dimensional and equally sized")
    denominator = np.linalg.norm(left) * np.linalg.norm(right)
    return float(np.clip(np.dot(left, right) / denominator, -1, 1)) if denominator else 0.0

def compare(left: str, right: str, mode: str | None = None) -> float:
    vectors = embed([left, right], mode)
    return cosine_similarity(vectors[0], vectors[1])
