from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ClassificationResult(BaseModel):
    resultId: Optional[str] = Field(None, alias="resultId")
    imageId: str  # foreign key to Waste model
    categoryID: str
    inferenceTime: datetime
    confidenceScore: float

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
