from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId


class ModelEvaluation(BaseModel):
    modelVersion: str = Field(
        ..., description="Version of the model evaluated (e.g., 1.0, 2.0)"
    )
    datasetId: ObjectId = Field(
        ..., description="Reference to the dataset used for evaluation"
    )
    evaluationDate: datetime = Field(default_factory=datetime.now)
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Overall accuracy score")
    precision: float = Field(
        ..., ge=0.0, le=1.0, description="Weighted precision score"
    )
    recall: float = Field(..., ge=0.0, le=1.0, description="Weighted recall score")
    f1_score: float = Field(..., ge=0.0, le=1.0, description="Weighted F1 score")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "modelVersion": "2.0",
                "datasetId": "66492a1d2f5f7b3a2c9a1111",
                "evaluationDate": "2026-05-03T12:00:00",
                "accuracy": 0.94,
                "precision": 0.93,
                "recall": 0.92,
                "f1_score": 0.925,
            }
        }
