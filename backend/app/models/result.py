from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ClassificationResult(BaseModel):
    resultId: Optional[str] = Field(None, alias="_id")
    imageId: str  # foreign key to Waste model
    categoryID: str
    inferenceTime: datetime
    confidenceScore: float

    class Config:
        allow_population_by_field_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
