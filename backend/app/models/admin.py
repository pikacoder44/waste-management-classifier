from pydantic import BaseModel, Field


class Admin(BaseModel):
    adminId: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    role: str = "admin"  # Default role is 'admin', can be 'user' for regular users

    class Config:
        populate_by_name = (
            True  # Allow using field names instead of aliases when creating instances
        )
        arbitrary_types_allowed = (
            True  # Allow arbitrary types (like ObjectId) without validation errors
        )
