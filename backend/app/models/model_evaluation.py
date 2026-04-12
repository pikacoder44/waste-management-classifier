from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
from bson import ObjectId


class ModelEvaluation(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    modelVersion: str = Field(
        ..., description="Version of the model evaluated (e.g., 1.0, 2.0)"
    )
    datasetId: ObjectId = Field(
        ..., description="Reference to the dataset used for evaluation"
    )
    evaluationDate: datetime = Field(default_factory=datetime.utcnow)

    # Overall Metrics
    overallAccuracy: float = Field(
        ..., ge=0.0, le=1.0, description="Overall accuracy score"
    )
    trainingTime: float = Field(
        ..., ge=0.0, description="Time taken to train model (in seconds)"
    )
    evaluationTime: float = Field(
        ..., ge=0.0, description="Time taken to evaluate model (in seconds)"
    )

    # Per-Category Metrics
    categoryMetrics: Dict[str, Dict[str, float]] = Field(
        ...,
        description="Metrics per category: {category: {precision, recall, f1_score, support}}",
    )

    # Additional Metrics
    macroAvgPrecision: float = Field(
        ..., ge=0.0, le=1.0, description="Macro-averaged precision"
    )
    macroAvgRecall: float = Field(
        ..., ge=0.0, le=1.0, description="Macro-averaged recall"
    )
    macroAvgF1Score: float = Field(
        ..., ge=0.0, le=1.0, description="Macro-averaged F1 score"
    )

    # Confusion Matrix (optional)
    confusionMatrix: Optional[Dict] = Field(None, description="Confusion matrix data")

    # Performance Notes
    notes: Optional[str] = Field(
        None, max_length=1000, description="Additional notes about model performance"
    )
    isLatestVersion: bool = Field(
        True, description="Whether this is the latest model version"
    )

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "modelVersion": "2.0",
                "overallAccuracy": 0.94,
                "macroAvgPrecision": 0.93,
                "macroAvgRecall": 0.92,
                "macroAvgF1Score": 0.925,
                "categoryMetrics": {
                    "Plastic": {"precision": 0.95, "recall": 0.94, "f1_score": 0.945},
                    "Organic": {"precision": 0.92, "recall": 0.91, "f1_score": 0.915},
                },
            }
        }
