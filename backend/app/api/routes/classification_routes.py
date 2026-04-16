from fastapi import APIRouter, HTTPException, UploadFile, Request
from app.ai.model_loader import model
from app.ai.preprocess import preprocess_image
from app.ai.predict import predict_image
from app.ai.imageQualityAnalysis import imageQualityAnalysis
from app.models.waste import Waste
from app.database.connection import db
from app.api.routes.auth_routes import get_user_id_from_token
from datetime import datetime
import cloudinary.uploader
from uuid import uuid4
import time
from bson import ObjectId

from app.services.recommendation_service import get_disposal_recommendation


router = APIRouter()


class_labels = {
    0: "cardboard",
    1: "paper",
    2: "metal",
    3: "glass",
    4: "plastic",
    5: "trash",
}


@router.post("/classification/analyze")
async def analyze_classification_result(file: UploadFile, request: Request):
    try:
        started_time = time.time()
        # Validate file is an image
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Read image bytes
        image_bytes = await file.read()

        # Check image quality
        quality_status = imageQualityAnalysis(image_bytes)
        if quality_status != "OK":
            return {
                "status": "error",
                "message": quality_status,
                "detail": "Please upload a clear, high-resolution image without blur",
            }

        # Upload file and preprocess
        loadedModel = model  # Ensure model is loaded

        # Preprocess image
        preprocessedImage = preprocess_image(image_bytes)

        # Predict image category
        predicted_class_label, confidence = predict_image(
            preprocessedImage, loadedModel, class_labels
        )

        # get user ID from JWT token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Access token not found")
        jwt_token = auth_header.split(" ")[1]
        user_id = get_user_id_from_token(jwt_token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid access token")
        user_id = str(user_id)  # Ensure user_id is a string for database storage

        upload_result = cloudinary.uploader.upload(
            image_bytes,
            folder=user_id,
            public_id=str(uuid4()),
        )
        image_url = upload_result["secure_url"]

        end_time = time.time()
        inference_time = end_time - started_time

        disposalRecommendation = get_disposal_recommendation(predicted_class_label)

        # Save classification result to database
        waste_entry = Waste(
            userId=user_id,
            filePath=image_url,
            publicId=upload_result["public_id"],
            createdAt=datetime.now().isoformat(),
            predictedLabel=predicted_class_label,
            confidence=confidence,
            inferenceTime=inference_time,
            disposalRecommendation=disposalRecommendation,
        )
        db.waste.insert_one(waste_entry.dict())

        return {
            "status": "success",
            "label": predicted_class_label,
            "confidence": confidence,
            "inferenceTime": inference_time,
            "disposalRecommendation": disposalRecommendation,
        }

    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions to be handled by FastAPI
    except Exception as e:
        print(f"Error during classification analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/classification/history")
async def get_classification_history(request: Request):
    try:
        # get user ID from JWT token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401, detail="Access token not found, Login first please"
            )
        jwt_token = auth_header.split(" ")[1]
        user_id = get_user_id_from_token(jwt_token)

        # if role is admin, return erorr: admin dont have classification history
        if user_id == "admin":
            raise HTTPException(
                status_code=403, detail="Admin users do not have classification history"
            )

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid access token")
        user_id = str(user_id)  # Ensure user_id is a string for database query

        # Fetch classification history from database
        history = list(db.waste.find({"userId": user_id}).sort("createdAt", -1))

        # Convert ObjectId to string and format createdAt
        for entry in history:
            entry["_id"] = str(entry["_id"])
            entry["createdAt"] = entry["createdAt"]

        if len(history) == 0:
            raise HTTPException(
                status_code=404, detail="No classification history found"
            )

        return {"status": "success", "history": history}

    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions to be handled by FastAPI
    except Exception as e:
        print(f"Error fetching classification history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/classification/history/{entry_id}")
async def delete_classification_entry(entry_id: str, request: Request):
    try:
        # get user ID from JWT token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401, detail="Access token not found, Login first please"
            )
        jwt_token = auth_header.split(" ")[1]
        user_id = get_user_id_from_token(jwt_token)

        # if role is admin, return erorr: admin dont have classification history
        if user_id == "admin":
            raise HTTPException(
                status_code=403, detail="Admin users do not have classification history"
            )

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid access token")
        user_id = str(user_id)  # Ensure user_id is a string for database query

        # Convert entry_id string to ObjectId for MongoDB query
        try:
            object_id = ObjectId(entry_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid entry ID format")

        # Fetch the entry BEFORE deletion to get publicId for Cloudinary cleanup
        entry = db.waste.find_one({"_id": object_id, "userId": user_id})
        if entry is None:
            raise HTTPException(status_code=404, detail="Entry not found")

        # Delete the entry from the database
        result = db.waste.delete_one({"_id": object_id, "userId": user_id})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, detail="Failed to delete classification entry"
            )

        # Delete image from Cloudinary
        try:
            result = cloudinary.uploader.destroy(entry["publicId"], invalidate=True)
            if not result.get("result") == "ok":
                raise HTTPException(
                    status_code=500, detail="Failed to delete image from Cloudinary"
                )
        except Exception as e:
            print(f"Error deleting image from Cloudinary: {e}")

        return {"status": "success", "message": "Classification entry deleted"}

    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions to be handled by FastAPI
    except Exception as e:
        print(f"Error deleting classification entry: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
