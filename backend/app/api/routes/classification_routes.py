from fastapi import APIRouter, HTTPException, UploadFile, Request
from app.ai.model_loader import model
from app.ai.preprocess import preprocess_image
from app.ai.predict import predict_image
from app.ai.imageProcessingService import ImageProcessingService
from app.models.waste_records import WasteRecords
from app.database.collections import waste_records_collection
from app.utils.db_helpers import sanitize_doc
from app.utils.auth_utils import verify_user_from_request
from app.services.cloudinary_image_service import (
    upload_image_bytes,
    delete_cloudinary_image,
)
from datetime import datetime
import time
from bson import ObjectId

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
        # Check if the file is an image not other formats
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Read the image file
        image_bytes = await file.read()

        # Check if user is logged in and get their ID
        user_id = verify_user_from_request(request)

        # image quality check and enhancement
        processing_result = ImageProcessingService.process_and_validate(image_bytes)

        # If image quality is not good enough, reject it
        if not processing_result["is_valid"]:
            raise HTTPException(status_code=400, detail=processing_result["message"])

        # Log if Image is improved and warnings if any
        if processing_result["was_enhanced"] and processing_result["warnings"]:
            print(f"[Classification] Note: {', '.join(processing_result['warnings'])}")

        # Get the final image (after enhancement if it happened)
        if processing_result["image_array"] is not None:
            final_image_bytes = ImageProcessingService.convert_to_bytes(
                processing_result["image_array"]
            )
        else:
            final_image_bytes = image_bytes

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        cloudinary_result = upload_image_bytes(
            final_image_bytes,
            folder=f"classifications/{user_id}",
            public_id=f"classification_{timestamp}",
            filename=f"{timestamp}.png",
        )

        # Resize and normalize image
        preprocessedImage = preprocess_image(final_image_bytes)

        # start timer to measure model speed
        inference_start = time.time()
        predicted_class_label, confidence = predict_image(
            preprocessedImage, model, class_labels
        )
        inference_time = time.time() - inference_start

        # Get disposal instructions based on what the model predicted
        disposalRecommendation = get_disposal_recommendation(predicted_class_label)

        # Create a record of this classification result
        waste_record = WasteRecords(
            userId=user_id,
            filePath=cloudinary_result["secure_url"],
            cloudinaryPublicId=cloudinary_result["public_id"],
            createdAt=datetime.now(),
            predictedLabel=predicted_class_label,
            confidence=confidence,
            inferenceTime=inference_time,
            disposalRecommendation=disposalRecommendation,
        )
        # Save the record to database
        waste_records_collection.insert_one(waste_record.model_dump())

        response = {
            "status": "success",
            "label": predicted_class_label,
            "confidence": confidence,
            "inferenceTime": inference_time,
            "disposalRecommendation": disposalRecommendation,
        }
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error during classification analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/classification/history")
async def get_classification_history(request: Request):
    try:
        # Check if user is logged in and get their ID
        user_id = verify_user_from_request(request)

        # Get all past classifications for this user
        history = list(
            waste_records_collection.find({"userId": user_id}).sort("createdAt", -1)
        )

        # Clean up the data before sending to user
        sanitized = [sanitize_doc(entry) for entry in history]

        return {"status": "success", "history": sanitized}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching classification history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/classification/history/{entry_id}")
async def delete_classification_entry(entry_id: str, request: Request):
    try:
        if waste_records_collection is None:
            raise HTTPException(
                status_code=503, detail="Database connection unavailable"
            )

        user_id = verify_user_from_request(request)

        # Validate and convert entry_id(string) to ObjectId
        try:
            object_id = ObjectId(entry_id)
        except Exception as e:
            print(f"Invalid ObjectId format: {entry_id} - {e}")
            raise HTTPException(status_code=400, detail="Invalid entry ID format")

        # Retrieve and delete entry from database
        try:
            entry = waste_records_collection.find_one(
                {"_id": object_id, "userId": user_id}
            )
            if entry is None:
                raise HTTPException(
                    status_code=404, detail="Classification entry not found"
                )

            result = waste_records_collection.delete_one(
                {"_id": object_id, "userId": user_id}
            )
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=404, detail="Failed to delete classification entry"
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Database error: {e}")
            raise HTTPException(status_code=503, detail="Database operation failed")

        # Delete associated image from Cloudinary
        if entry.get("filePath"):
            try:
                delete_cloudinary_image(
                    entry.get("cloudinaryPublicId") or entry.get("filePath")
                )
            except Exception as e:
                print(f"Failed to delete image file: {e}")
                raise HTTPException(
                    status_code=500, detail="Failed to delete image file"
                )
        else:
            print("No file path found in entry")

        return {"status": "success", "message": "Classification entry deleted"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error deleting classification entry: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
