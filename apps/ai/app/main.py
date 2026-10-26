from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from .embeddings import get_model

load_dotenv()

@asynccontextmanager
async def lifespan(_app: FastAPI):
    mode = os.getenv("EMBEDDING_MODE", "fixture")
    if mode not in {"fixture", "transformer"}:
        raise ValueError("Invalid EMBEDDING_MODE")
    if mode == "transformer" and os.getenv("PRELOAD_MODEL", "false").lower() == "true":
        get_model()
    yield

app = FastAPI(title="CaseBridge AI foundation", lifespan=lifespan)

@app.get("/health")
def health():
    return {"success": True, "message": "CaseBridge AI service is running", "mode": os.getenv("EMBEDDING_MODE", "fixture")}

# No inference HTTP route yet. Joel owns authentication, payload minimization,
# candidate retrieval and the public matching contract before exposing one.
