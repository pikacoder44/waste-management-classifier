recommendations = {
    "cardboard": "Consider recycling cardboard waste to reduce landfill and save resources.",
    "paper": "Recycle paper waste to conserve trees and reduce landfill space.",
    "metal": "Recycle metal waste to conserve natural resources and reduce energy consumption.",
    "glass": "Recycle glass waste to save energy and reduce landfill space.",
    "plastic": "Recycle plastic waste to reduce pollution and conserve resources.",
    "trash": "Dispose of trash waste properly to prevent pollution and protect the environment.",
}

def get_disposal_recommendation(predicted_label: str) -> str:
    return recommendations.get(predicted_label, "No recommendation available for this category.")