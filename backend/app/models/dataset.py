from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class Dataset(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = Field(None, max_length=500)
    uploadDate: datetime
    lastUpdated: datetime
    filePath: str = Field(..., description="The file path where the dataset is stored")
    version: Optional[float] = Field(None, max_length=20)
    

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
