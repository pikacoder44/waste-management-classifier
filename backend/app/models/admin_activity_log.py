from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId


class AdminActivityLog(BaseModel):
    id: Optional[ObjectId] = Field(None, alias="_id")
    adminId: ObjectId = Field(
        ..., description="Reference to the admin user who performed the action"
    )
    action: Literal[
        "upload_dataset",
        "retrain_model",
        "activate_model",
        "deactivate_model",
        "update_dataset",
        "delete_dataset",
        "view_evaluation_report",
        "generate_report",
        "update_disposal_recommendations",
        "system_maintenance",
        "user_management",
        "other",
    ] = Field(..., description="Type of action performed")

    targetId: Optional[ObjectId] = Field(
        None, description="ID of the resource affected (dataset, model, user, etc.)"
    )
    targetType: Optional[
        Literal["dataset", "model", "user", "classification", "system"]
    ] = Field(None, description="Type of resource affected")

    timestamp: datetime = Field(default_factory=datetime.utcnow)

    details: Optional[str] = Field(
        None, max_length=1000, description="Detailed information about the action"
    )
    status: Literal["success", "failure", "pending"] = Field(
        "success", description="Status of the action"
    )
    errorMessage: Optional[str] = Field(
        None, description="Error message if action failed"
    )

    ipAddress: Optional[str] = Field(
        None, description="IP address of the admin who performed action"
    )
    userAgent: Optional[str] = Field(None, description="User agent/browser information")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "adminId": "507f1f77bcf86cd799439011",
                "action": "retrain_model",
                "targetType": "model",
                "status": "success",
                "details": "Model retrained with new dataset version 2.0, achieving 94% accuracy",
            }
        }
