from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId


class ModelEvaluation(BaseModel):
    modelVersion: str = Field(
        ..., description="Version of the model evaluated (e.g., 1.0, 2.0)"
    )
    datasetId: ObjectId | None = Field(
        default=None, description="Reference to the dataset used for evaluation"
    )
    evaluationDate: datetime = Field(default_factory=datetime.now)
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Overall accuracy score")
    precision: float = Field(
        ..., ge=0.0, le=1.0, description="Weighted precision score"
    )
    recall: float = Field(..., ge=0.0, le=1.0, description="Weighted recall score")
    f1_score: float = Field(..., ge=0.0, le=1.0, description="Weighted F1 score")
    confusionMatrixUrl: str | None = Field(
        default=None,
        description="Cloudinary secure URL for the generated confusion matrix image",
    )
    confusionMatrixPublicId: str | None = Field(
        default=None,
        description="Cloudinary public ID for the generated confusion matrix image",
    )

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
