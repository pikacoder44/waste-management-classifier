from pydantic import BaseModel, Field
from typing import Literal

class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8, max_length=30)
    role: Literal["user", "admin"] = "user"

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True