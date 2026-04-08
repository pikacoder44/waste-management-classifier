from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class Dataset(BaseModel):
    datasetId: Optional[str] = Field(None, alias="datasetId")
    uploadDate: datetime
    lastUpdated: datetime

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
