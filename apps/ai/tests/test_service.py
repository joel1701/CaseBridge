import secrets
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app import main
from app.embeddings import ModelUnavailable

@pytest.fixture
def client(monkeypatch):
    token = secrets.token_hex(32)
    monkeypatch.setenv("AI_SERVICE_TOKEN", token)
    monkeypatch.setenv("EMBEDDING_MODE", "fixture")
    monkeypatch.setenv("PRELOAD_MODEL", "false")
    with TestClient(main.app) as c:
        c.headers["Authorization"] = f"Bearer {token}"
        yield c

def test_batch_pairs(client, monkeypatch):
    monkeypatch.setattr(main, 'embed', lambda texts, mode: np.array([[1.,0.], [.8,.6], [0.,1.]]))
    response = client.post('/v1/similarities', json={'pairs':[{'id':'related','left':'extra fees','right':'unapproved charges'},{'id':'unrelated','left':'extra fees','right':'roof repair'}]})
    assert response.status_code == 200
    results = response.json()['data']
    assert results[0]['cosineSimilarity'] == pytest.approx(.8)
    assert results[1]['cosineSimilarity'] == 0
    assert response.json()['recommendationOnly'] is True

def test_validation_and_token(client):
    for pairs in [[], [{'id':'a','left':' ','right':'x'}], [{'id':'a','left':'x','right':'x'}]*2]:
        assert client.post('/v1/similarities',json={'pairs':pairs}).status_code == 422
    client.headers['Authorization'] = 'Bearer wrong'
    assert client.post('/v1/similarities',json={'pairs':[{'id':'a','left':'x','right':'y'}]}).status_code == 401

def test_model_failure_is_not_fallback(client, monkeypatch):
    def broken(*_): raise ModelUnavailable('private internal path')
    monkeypatch.setattr(main, 'embed', broken)
    response=client.post('/v1/similarities',json={'pairs':[{'id':'a','left':'x','right':'y'}]})
    assert response.status_code == 503
    assert response.json()['error']['code'] == 'MODEL_UNAVAILABLE'
    assert 'private' not in response.text

def test_request_size_limit(client):
    assert client.post('/v1/similarities',content=b'x'*1_000_001).status_code == 413

def test_busy_does_not_queue_unbounded_work(client):
    main._inference_slot.acquire()
    try:
        response=client.post('/v1/similarities',json={'pairs':[{'id':'a','left':'x','right':'y'}]})
        assert response.status_code == 503
        assert response.json()['error']['code'] == 'AI_BUSY'
    finally: main._inference_slot.release()
