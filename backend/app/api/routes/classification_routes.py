from fastapi import APIRouter, HTTPException, UploadFile, Request
from app.ai.model_loader import model
from app.ai.preprocess import preprocess_image
from app.ai.predict import predict_image
from app.models.waste import Waste
from app.database.collections import waste_collection
from app.utils.auth_utils import verify_user_from_request
from datetime import datetime
import time
import os
from bson import ObjectId
from pathlib import Path

from app.services.recommendation_service import get_disposal_recommendation


router = APIRouter()


class_labels = {
    0: "cardboard",
    1: "glass",
    2: "metal",
    3: "paper",
    4: "plastic",
    5: "trash",
}


@router.post("/classification/analyze")
async def analyze_classification_result(file: UploadFile, request: Request):
    try:
        # Validate file is an image
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Read image bytes
        image_bytes = await file.read()

        # Get user ID from JWT token
        user_id = verify_user_from_request(request)

        # Create user upload directory if it doesn't exist
        user_upload_dir = Path(f"uploads/{user_id}")
        user_upload_dir.mkdir(parents=True, exist_ok=True)

        # Save image locally with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"{timestamp}.png"
        image_path = user_upload_dir / image_filename

        with open(image_path, "wb") as f:
            f.write(image_bytes)

        # Preprocess image
        preprocessedImage = preprocess_image(image_bytes)

        # Measure only model inference time
        inference_start = time.time()
        # Predict image category
        predicted_class_label, confidence = predict_image(
            preprocessedImage, model, class_labels
        )
        inference_time = time.time() - inference_start

        disposalRecommendation = get_disposal_recommendation(predicted_class_label)

        # Save classification result to database
        waste_entry = Waste(
            userId=user_id,
            filePath=str(image_path),
            createdAt=datetime.now().isoformat(),
            predictedLabel=predicted_class_label,
            confidence=confidence,
            inferenceTime=inference_time,
            disposalRecommendation=disposalRecommendation,
        )
        waste_collection.insert_one(waste_entry.dict())

        return {
            "status": "success",
            "label": predicted_class_label,
            "confidence": confidence,
            "inferenceTime": inference_time,
            "disposalRecommendation": disposalRecommendation,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error during classification analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/classification/history")
async def get_classification_history(request: Request):
    try:
        # Get user ID from JWT token
        user_id = verify_user_from_request(request)

        # Fetch classification history from database
        history = list(waste_collection.find({"userId": user_id}).sort("createdAt", -1))

        # Convert ObjectId to string
        for entry in history:
            entry["_id"] = str(entry["_id"])

        return {"status": "success", "history": history}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching classification history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/classification/history/{entry_id}")
async def delete_classification_entry(entry_id: str, request: Request):
    try:

        user_id = verify_user_from_request(request)

        # Convert entry_id string to ObjectId for MongoDB query
        try:
            object_id = ObjectId(entry_id)
        except Exception as e:
            print(f"Invalid ObjectId format: {entry_id} - {e}")
            raise HTTPException(status_code=400, detail="Invalid entry ID format")

        # Fetch the entry BEFORE deletion to get filePath for cleanup
        entry = waste_collection.find_one({"_id": object_id, "userId": user_id})
        if entry is None:
            raise HTTPException(status_code=404, detail="Entry not found")

        # Delete the entry from the database
        result = waste_collection.delete_one({"_id": object_id, "userId": user_id})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, detail="Failed to delete classification entry"
            )

        # Delete image file from local storage
        try:
            if os.path.exists(entry["filePath"]):
                os.remove(entry["filePath"])
            else:
                print(f"Image file not found: {entry['filePath']}")
        except Exception as e:
            print(f"Error deleting image file at {entry['filePath']}: {e}")

        return {"status": "success", "message": "Classification entry deleted"}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error deleting classification entry: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
