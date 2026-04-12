from pydantic import BaseModel, Field
from typing import Literal

class DisposalRecommendation(BaseModel):
    recommendation: str = Field(
        ..., min_length=10, description="Primary disposal method recommendation"
    )

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

recommendations = {
    "cardboard": "Consider recycling cardboard waste to reduce landfill and save resources.",
    "paper": "Recycle paper waste to conserve trees and reduce landfill space.",
    "metal": "Recycle metal waste to conserve natural resources and reduce energy consumption.",
    "glass": "Recycle glass waste to save energy and reduce landfill space.",
    "plastic": "Recycle plastic waste to reduce pollution and conserve resources.",
    "trash": "Dispose of trash waste properly to prevent pollution and protect the environment.",
}


class WasteCategory(BaseModel):
    categoryId: int = Field(
        ..., description="The unique identifier for the waste category"
    )
    categoryName: str = Field(..., description="The name of the waste category")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
