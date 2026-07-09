from pydantic import BaseModel, Field
from typing import Optional, Union, Dict, Any
from datetime import datetime


class WasteRecords(BaseModel):
    userId: str  # logical foreign key to User model
    filePath: str = Field(
        ..., description="Local file path where the uploaded image is stored"
    )
    createdAt: datetime = Field(default_factory=datetime.now)
    predictedLabel: str = Field(
        ..., description="The predicted class label for the waste item"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="The confidence score of the prediction (0 to 1)",
    )
    inferenceTime: float = Field(
        ...,
        description="The time taken for the AI model to make the prediction (in seconds)",
    )
    disposalRecommendation: Optional[Union[str, Dict[str, Any]]] = Field(
        None,
        description="Structured disposal recommendation with method, description, and benefits",
    )
