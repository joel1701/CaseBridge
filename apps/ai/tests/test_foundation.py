import numpy as np
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.embeddings import embed
from app.matcher import compare, cosine_similarity
from app.schemas import ComparisonRequest

def test_health_does_not_load_model(monkeypatch):
    monkeypatch.setenv("EMBEDDING_MODE", "fixture")
    monkeypatch.setattr("app.main.get_model", lambda: pytest.fail("Health must not load the model"))
    with TestClient(app) as client:
        assert client.get("/health").json()["success"] is True

def test_fixture_repeatable():
    assert np.array_equal(embed(["fee complaint"], "fixture"), embed(["fee complaint"], "fixture"))
    assert compare("same text", "same text", "fixture") == pytest.approx(1)

def test_cosine_edges():
    assert cosine_similarity(np.zeros(2), np.ones(2)) == 0
    assert cosine_similarity(np.array([1,0]), np.array([0,1])) == 0
    assert cosine_similarity(np.array([1,0]), np.array([-1,0])) == -1
    with pytest.raises(ValueError): cosine_similarity(np.ones(2), np.ones(3))
    with pytest.raises(ValueError): cosine_similarity(np.array([np.nan]), np.ones(1))

def test_validation():
    with pytest.raises(ValidationError): ComparisonRequest(left="", right="text")
    with pytest.raises(ValidationError): ComparisonRequest(left="text", right="text", unwanted=True)

def test_unknown_mode():
    with pytest.raises(ValueError): embed(["text"], "unknown")
