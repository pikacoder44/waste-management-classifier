recommendations = {
    "cardboard": {
        "disposal_method": "Compost",
        "description": "Cardboard can go in the compost if it is clean and free from plastic tape, labels, or heavy coatings. Tear it into smaller pieces so it breaks down more easily.",
        "benefits": "Composting cardboard helps reduce waste sent to landfill and adds useful carbon material to the compost.",
    },
    "paper": {
        "disposal_method": "Compost",
        "description": "Plain paper can be composted when it is clean and free from plastic coating, glitter, or heavy ink. Shredding it first can help it decompose faster.",
        "benefits": "Composting paper reduces landfill waste and helps create a better balance of dry material in the compost.",
    },
    "metal": {
        "disposal_method": "Recycle Bin",
        "description": "Put metal items in the recycling bin. If the container held food or drink, rinse it out first so it is easier to process.",
        "benefits": "Recycling metal saves resources and reduces the need to produce new material from scratch.",
    },
    "glass": {
        "disposal_method": "Recycle Bin",
        "description": "Place glass bottles and jars in the recycling bin. Rinse them first and follow your local sorting rules if glass needs to be separated.",
        "benefits": "Recycling glass helps save raw materials and keeps usable glass out of landfill.",
    },
    "plastic": {
        "disposal_method": "Recycle Bin",
        "description": "Put recyclable plastic in the recycling bin. Check the plastic number and follow local recycling rules, since not every type is accepted everywhere.",
        "benefits": "Recycling plastic helps reduce landfill waste and lowers the amount of plastic that ends up polluting the environment.",
    },
    "trash": {
        "disposal_method": "Special Disposal",
        "description": "This waste should go to special disposal or a designated collection point. It should not be mixed with recycling or compost.",
        "benefits": "Using the right disposal method keeps other waste streams clean and helps reduce contamination.",
    },
}


def get_disposal_recommendation(predicted_label: str) -> dict:
    # Get structured disposal recommendation based on waste type.
    recommendation = recommendations.get(
        predicted_label,
        {
            "disposal_method": "Unknown",
            "description": "No specific disposal recommendation is available for this item.",
            "benefits": "Please check your local waste disposal guidelines.",
        },
    )
    return recommendation
