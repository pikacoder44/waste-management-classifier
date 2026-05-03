recommendations = {
    "cardboard": {
        "disposal_method": "Compost",
        "description": "As an organic material, cardboard should be composted. Remove any plastic tape or non-paper materials before composting. Ensure it is uncoated and chemical-free.",
        "benefits": "Cardboard composting reduces landfill waste and returns nutrients to soil. It breaks down naturally and enriches compost for gardens and landscaping.",
    },
    "paper": {
        "disposal_method": "Compost",
        "description": "As an organic material, paper waste should be composted. Separate glossy or plastic-coated papers for recycling or special disposal instead.",
        "benefits": "Paper composting reduces landfill space and returns organic matter to soil. One ton of paper returns valuable carbon to composting systems.",
    },
    "metal": {
        "disposal_method": "Recycle Bin",
        "description": "Place metal items in the recycling bin. Rinse metal containers to remove food residue for better recycling efficiency.",
        "benefits": "Metal recycling reduces energy consumption by 95% compared to producing new metal. Aluminum cans can be recycled infinitely without quality loss.",
    },
    "glass": {
        "disposal_method": "Recycle Bin",
        "description": "Place glass items in the recycling bin. Rinse containers and keep glass separate from other recyclables when possible.",
        "benefits": "Glass recycling saves 30% energy compared to making new glass. Glass can be recycled indefinitely without losing purity or quality.",
    },
    "plastic": {
        "disposal_method": "Recycle Bin",
        "description": "Place plastic waste in the recycling bin. Check the recycling number (1-7) and follow local recycling guidelines for accepted types.",
        "benefits": "Plastic recycling reduces ocean pollution and landfill waste. Recycled plastic is converted into new products, fiber, and fuel.",
    },
    "trash": {
        "disposal_method": "Special Disposal",
        "description": "Dispose of this waste in the general trash bin or through special collection services. Do not place in recycling or compost.",
        "benefits": "Proper disposal prevents contamination of recycling streams and protects environmental quality. Some waste may be processed for waste-to-energy.",
    },
}


def get_disposal_recommendation(predicted_label: str) -> dict:
    """
    Get structured disposal recommendation based on waste type.
    Returns a dictionary with disposal method, description, and benefits.
    """
    recommendation = recommendations.get(
        predicted_label,
        {
            "disposal_method": "Unknown",
            "description": "No specific recommendation available for this category.",
            "benefits": "Please consult local waste disposal guidelines.",
        },
    )
    return recommendation
