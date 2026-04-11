from pydantic import BaseModel, Field
from typing import Optional


class Waste(BaseModel):
    userId: str  # foreign key to User model
    filePath: Optional[str] = Field(
        None, description="The file path where the uploaded image is stored"
    )
    uploadDate: str
    predictedLabel: Optional[str] = Field(
        None, description="The predicted class label for the waste item"
    )
    confidence: Optional[float] = Field(
        None, description="The confidence score of the prediction (0 to 1)"
    )
    inferenceTime: Optional[float] = Field(
        None,
        description="The time taken for the AI model to make the prediction (in seconds)",
    )

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
