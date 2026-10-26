from pydantic import BaseModel, ConfigDict, Field

class ComparisonRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    left: str = Field(min_length=1, max_length=10000)
    right: str = Field(min_length=1, max_length=10000)

class ComparisonResponse(BaseModel):
    score: float = Field(ge=-1, le=1)
    mode: str
    model: str
    recommendation_only: bool = True
