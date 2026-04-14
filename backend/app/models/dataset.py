from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal
from bson import ObjectId


class Dataset(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    version: str = Field(default="1.0", description="Dataset version (e.g., 1.0, 2.0)")
    imageCount: int = Field(..., ge=0, description="Number of images in the dataset")
    filePath: str = Field(..., description="The file path where the dataset is stored")
    label: Optional[str] = Field(
        None, description="Waste category for the dataset"
    )
    uploadDate: datetime = Field(default_factory=datetime.utcnow)
    lastUpdated: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "name": "Waste Dataset v2",
                "version": "2.0",
                "status": "active",
                "imageCount": 5000,
                "categories": [
                    "Organic",
                    "Plastic",
                    "Glass",
                    "Metal",
                    "Paper",
                    "Other",
                ],
            }
        }
