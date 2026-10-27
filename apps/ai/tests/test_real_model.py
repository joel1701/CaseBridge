"""Opt-in tests use cached real MiniLM weights and never download during pytest."""
import os
import pytest
from app.embeddings import embed
from app.matcher import cosine_similarity

@pytest.mark.skipif(os.getenv('RUN_MODEL_TESTS') != '1', reason='Set RUN_MODEL_TESTS=1 after provisioning MiniLM')
def test_real_model_paraphrase_beats_unrelated_infrastructure(monkeypatch):
    monkeypatch.setenv('ALLOW_MODEL_DOWNLOAD','false')
    texts=['Students report unauthorised collection of admission fees.','Institute demanding extra payments beyond approved charges.','A laboratory roof leaks during rainfall; repair and safety inspection requested.']
    vectors=embed(texts,'transformer')
    related=cosine_similarity(vectors[0],vectors[1])
    unrelated=cosine_similarity(vectors[0],vectors[2])
    assert related > unrelated
    assert vectors.shape == (3,384)
    assert cosine_similarity(vectors[0],vectors[0]) == pytest.approx(1)
