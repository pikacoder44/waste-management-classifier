from pydantic import BaseModel, Field
from typing import Literal, List, Optional


class DisposalRecommendation(BaseModel):
    disposal_method: str = Field(
        ...,
        description="Primary disposal method (Recycle Bin, Compost, Special Disposal)",
    )
    description: str = Field(..., description="Specific instructions for disposal")
    benefits: str = Field(..., description="Environmental/sustainability benefits")
    alternatives: Optional[List[str]] = Field(
        default=None, description="Alternative disposal methods"
    )

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


recommendations = {
    "cardboard": {
        "disposal_method": "Recycle Bin",
        "description": "Place cardboard in the recycling bin. Remove any plastic tape or non-paper materials before recycling.",
        "benefits": "Cardboard recycling reduces landfill waste by 15% and saves natural resources. Recycled cardboard is used to create new packaging and paper products.",
        "alternatives": ["Compost (if uncoated and chemical-free)"],
    },
    "paper": {
        "disposal_method": "Recycle Bin",
        "description": "Place paper waste in the recycling bin. Separate glossy or plastic-coated papers for special disposal.",
        "benefits": "Paper recycling conserves trees and reduces landfill space. One ton of recycled paper saves 17 trees and 7,000 gallons of water.",
        "alternatives": ["Compost (if unbleached and uncoated)"],
    },
    "metal": {
        "disposal_method": "Recycle Bin",
        "description": "Place metal items in the recycling bin. Rinse metal containers to remove food residue for better recycling efficiency.",
        "benefits": "Metal recycling reduces energy consumption by 95% compared to producing new metal. Aluminum cans can be recycled infinitely without quality loss.",
        "alternatives": None,
    },
    "glass": {
        "disposal_method": "Recycle Bin",
        "description": "Place glass items in the recycling bin. Rinse containers and keep glass separate from other recyclables when possible.",
        "benefits": "Glass recycling saves 30% energy compared to making new glass. Glass can be recycled indefinitely without losing purity or quality.",
        "alternatives": None,
    },
    "plastic": {
        "disposal_method": "Recycle Bin",
        "description": "Place plastic waste in the recycling bin. Check the recycling number (1-7) and follow local recycling guidelines for accepted types.",
        "benefits": "Plastic recycling reduces ocean pollution and landfill waste. Recycled plastic is converted into new products, fiber, and fuel.",
        "alternatives": None,
    },
    "trash": {
        "disposal_method": "Special Disposal",
        "description": "Dispose of this waste in the general trash bin or through special collection services. Do not place in recycling or compost.",
        "benefits": "Proper disposal prevents contamination of recycling streams and protects environmental quality. Some waste may be processed for waste-to-energy.",
        "alternatives": None,
    },
}


class WasteCategory(BaseModel):
    categoryId: int = Field(
        ..., description="The unique identifier for the waste category"
    )
    categoryName: str = Field(..., description="The name of the waste category")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
