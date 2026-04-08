from .connection import db

user_collection = db["users"]
waste_collection = db["waste_images"]
classification_collection = db["classification_results"]
model_collection = db["models"]
dataset_collection = db["datasets"]
category_collection = db["waste_categories"]
recommendation_collection = db["recommendations"]
