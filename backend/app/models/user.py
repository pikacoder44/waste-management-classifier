from pydantic import BaseModel,  Field
from typing import Optional


class User(BaseModel):
    userId: Optional[str] = Field(None, alias="_id")
    hashed_password: str
    role: str = "user"  # Default role is 'user', can be 'admin' for administrators

    class Config:
        allow_population_by_field_name = True # Allow using field names instead of aliases when creating instances
        arbitrary_types_allowed = True # Allow arbitrary types (like ObjectId) without validation errors
