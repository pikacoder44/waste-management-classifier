from pydantic import BaseModel,  Field
from typing import Optional


class Waste(BaseModel):
    imageId: Optional[str] = Field(None, alias="imageId")
    userId: str  # foreign key to User model
    filePath: str
    uploadDate: str

    class Config:
        allow_population_by_field_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
