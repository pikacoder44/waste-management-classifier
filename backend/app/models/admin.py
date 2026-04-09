from pydantic import BaseModel, Field
from typing import Optional


class Admin(BaseModel):
    adminId: Optional[str] = Field(None, alias="adminId")
    password: str
    role: str = "admin"  # Default role is 'admin'

    class Config:
        populate_by_name = True # Allow using field names instead of aliases when creating instances
        arbitrary_types_allowed = True # Allow arbitrary types (like ObjectId) without validation errors
