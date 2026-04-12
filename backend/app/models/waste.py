from pydantic import BaseModel, Field
from typing import Optional


class Waste(BaseModel):
    userId: str  # foreign key to User model
    filePath: Optional[str] = Field(
        None, description="The file path where the uploaded image is stored"
    )
    createdAt: str
    predictedLabel: str = Field(
        ..., description="The predicted class label for the waste item"
    )
    confidence: float = Field(
        ..., description="The confidence score of the prediction (0 to 1)"
    )
    inferenceTime: float = Field(
        ...,
        description="The time taken for the AI model to make the prediction (in seconds)",
    )
    disposalRecommendation: Optional[str] = Field(
        None, description="Recommended disposal method based on the predicted label"
    )

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
