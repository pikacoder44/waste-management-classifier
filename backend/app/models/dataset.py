from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class Dataset(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    version: str = Field(default="1.0", description="Dataset version (e.g., 1.0, 2.0)")
    imageCount: int = Field(..., ge=0, description="Number of images in the dataset")
    filePath: str = Field(..., description="The file path where the dataset is stored")
    uploadDate: datetime = Field(default_factory=datetime.now)
    lastUpdated: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "name": "Waste Dataset v2",
                "description": "A comprehensive waste classification dataset",
                "version": "2.0",
                "imageCount": 5000,
                "filePath": "dataset/custom/",
                "uploadDate": "2026-05-01T10:30:00",
                "lastUpdated": "2026-05-01T10:30:00",
            }
        }
