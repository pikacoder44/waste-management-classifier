from pydantic import BaseModel,  Field
from typing import Optional


class Waste(BaseModel):
    userId: str  # foreign key to User model
    filePath: str
    uploadDate: str

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
