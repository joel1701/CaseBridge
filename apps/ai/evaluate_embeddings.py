"""Generate real similarities for the TS matching evaluator; never call fixture mode."""
import csv
import json
from pathlib import Path
from app.embeddings import embed, model_version
from app.matcher import cosine_similarity

root = Path(__file__).resolve().parents[2]
rows = list(csv.DictReader((root / "data/sample_complaints.csv").open()))
vectors = dict(zip((r["id"] for r in rows), embed([r["description"] for r in rows], "transformer")))
pairs = json.loads((root / "data/known_case_pairs.json").read_text())
results = [{**p, "semanticSimilarity": cosine_similarity(vectors[p["sourceComplaintId"]], vectors[p["targetComplaintId"]])} for p in pairs]
output = {"modelVersion": model_version(), "mode": "transformer", "pairs": results}
Path("evaluation-local.json").write_text(json.dumps(output, indent=2) + "\n")
print(json.dumps(output, indent=2))
