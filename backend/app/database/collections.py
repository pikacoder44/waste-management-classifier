from .connection import db

user_collection = db["users"]
waste_collection = db["waste_images"]
dataset_collection = db["datasets"]
model_evaluation_collection = db["model_evaluations"]
