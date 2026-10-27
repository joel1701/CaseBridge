from contextlib import asynccontextmanager
import hmac
import logging
import os
import threading
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .embeddings import ModelUnavailable, embed, get_model, model_version
from .matcher import cosine_similarity
from .schemas import BatchRequest, BatchResponse, SimilarityResult

load_dotenv()
_inference_slot = threading.BoundedSemaphore(1)
logger = logging.getLogger("casebridge.ai")

class ServiceError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message

def error_response(status: int, code: str, message: str):
    return JSONResponse(status_code=status, content={"success": False, "error": {"code": code, "message": message}})

def require_service_token(authorization: str | None = Header(default=None)):
    expected = os.getenv("AI_SERVICE_TOKEN", "")
    if len(expected) < 32:
        raise ServiceError(503, "SERVICE_NOT_CONFIGURED", "AI service authentication is not configured")
    supplied = authorization.removeprefix("Bearer ") if authorization and authorization.startswith("Bearer ") else ""
    if not hmac.compare_digest(supplied.encode(), expected.encode()):
        raise ServiceError(401, "UNAUTHENTICATED", "Valid service credentials required")

@asynccontextmanager
async def lifespan(_app: FastAPI):
    mode = os.getenv("EMBEDDING_MODE", "transformer")
    if mode not in {"fixture", "transformer"}:
        raise ValueError("Invalid EMBEDDING_MODE")
    if mode == "transformer" and os.getenv("PRELOAD_MODEL", "false").lower() == "true":
        try:
            get_model()
        except ModelUnavailable:
            logger.warning("Model preload failed; health remains available, inference returns 503")
    yield

app = FastAPI(title="CaseBridge AI", lifespan=lifespan)

@app.exception_handler(ServiceError)
async def service_error(_request, exc):
    return error_response(exc.status, exc.code, exc.message)

@app.exception_handler(RequestValidationError)
async def invalid_request(_request, _exc):
    # Do not echo complaint text or authorization credentials from validation input.
    return error_response(422, "VALIDATION_ERROR", "Invalid comparison batch")

@app.get("/health")
def health():
    return {"success": True, "message": "CaseBridge AI service is running", "mode": os.getenv("EMBEDDING_MODE", "transformer")}

@app.post("/v1/similarities", response_model=BatchResponse, dependencies=[Depends(require_service_token)])
def similarities(body: BatchRequest):
    if not _inference_slot.acquire(blocking=False):
        raise ServiceError(503, "AI_BUSY", "Encoder is busy; retry later")
    try:
        mode = os.getenv("EMBEDDING_MODE", "transformer")
        texts = list(dict.fromkeys(text for pair in body.pairs for text in (pair.left, pair.right)))
        vectors = dict(zip(texts, embed(texts, mode)))
        return BatchResponse(data=[SimilarityResult(id=p.id, cosineSimilarity=cosine_similarity(vectors[p.left], vectors[p.right])) for p in body.pairs], modelVersion=model_version() if mode == "transformer" else "fixture-hash-v1", mode=mode)
    except ModelUnavailable as exc:
        raise ServiceError(503, "MODEL_UNAVAILABLE", "Embedding model unavailable") from exc
    finally:
        _inference_slot.release()

class BodyLimitMiddleware:
    """Bound chunked bodies too, before JSON decoding; no dependency on proxy limits."""
    def __init__(self, app, limit=1_000_000):
        self.app, self.limit = app, limit

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("method") != "POST":
            return await self.app(scope, receive, send)
        chunks, total = [], 0
        while True:
            event = await receive()
            if event["type"] == "http.disconnect":
                return
            total += len(event.get("body", b""))
            if total > self.limit:
                return await error_response(413, "PAYLOAD_TOO_LARGE", "Body exceeds 1 MB")(scope, receive, send)
            chunks.append(event)
            if not event.get("more_body", False):
                break
        async def replay():
            return chunks.pop(0) if chunks else await receive()
        await self.app(scope, replay, send)

app.add_middleware(BodyLimitMiddleware)
