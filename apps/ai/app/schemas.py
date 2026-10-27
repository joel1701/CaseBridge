from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]
Identifier = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=128)]

class ComparisonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    left: Text
    right: Text

class ComparisonResponse(BaseModel):
    score: float = Field(ge=-1, le=1, allow_inf_nan=False)
    mode: str
    model: str
    recommendation_only: bool = True

class ComparisonPair(ComparisonRequest):
    id: Identifier

class BatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    pairs: list[ComparisonPair] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def bounded_unique_batch(self):
        if len({pair.id for pair in self.pairs}) != len(self.pairs):
            raise ValueError("Pair IDs must be unique")
        if sum(len(p.left) + len(p.right) for p in self.pairs) > 200000:
            raise ValueError("Batch text exceeds 200000 characters")
        return self

class SimilarityResult(BaseModel):
    id: str
    cosineSimilarity: float = Field(ge=-1, le=1, allow_inf_nan=False)

class BatchResponse(BaseModel):
    success: Literal[True] = True
    data: list[SimilarityResult]
    modelVersion: str
    mode: Literal["transformer", "fixture"]
    recommendationOnly: Literal[True] = True
