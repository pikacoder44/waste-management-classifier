from fastapi import APIRouter, HTTPException, UploadFile, Request
from app.ai.model_loader import model
from app.ai.preprocess import preprocess_image
from app.ai.predict import predict_image
from app.ai.imageProcessingService import ImageProcessingService
from app.models.waste import Waste
from app.database.collections import waste_collection
from app.utils.db_helpers import sanitize_doc
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

        # Step 1: Check image quality and auto-enhance if needed
        processing_result = ImageProcessingService.process_and_validate(image_bytes)

        # If image is not valid, return error
        if not processing_result["is_valid"]:
            raise HTTPException(status_code=400, detail=processing_result["message"])

        # Log quality enhancement info to backend terminal if image was enhanced
        if processing_result["was_enhanced"]:
            print(
                f"✓ Image enhanced: Original quality: {processing_result['original_quality']:.1f}% → Enhanced quality: {processing_result['quality_score']:.1f}%"
            )
            if processing_result["warnings"]:
                print(f"  Warnings: {', '.join(processing_result['warnings'])}")
        else:
            print(
                f"✓ Image quality acceptable: {processing_result['quality_score']:.1f}%"
            )

        # Save image locally with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"{timestamp}.png"
        image_path = user_upload_dir / image_filename

        # Convert enhanced image back to bytes for saving and preprocessing
        if processing_result["image_array"] is not None:
            final_image_bytes = ImageProcessingService.convert_to_bytes(
                processing_result["image_array"]
            )
        else:
            final_image_bytes = image_bytes

        with open(image_path, "wb") as f:
            f.write(final_image_bytes)

        # Step 2: Preprocess image for model
        preprocessedImage = preprocess_image(final_image_bytes)

        # Step 3: Run inference
        inference_start = time.time()
        predicted_class_label, confidence = predict_image(
            preprocessedImage, model, class_labels
        )
        inference_time = time.time() - inference_start

        disposalRecommendation = get_disposal_recommendation(predicted_class_label)

        # Step 4: Save classification result to database
        waste_entry = Waste(
            userId=user_id,
            filePath=str(image_path),
            createdAt=datetime.now(),
            predictedLabel=predicted_class_label,
            confidence=confidence,
            inferenceTime=inference_time,
            disposalRecommendation=disposalRecommendation,
        )
        waste_collection.insert_one(waste_entry.dict())

        # Return response (quality processing is internal only)
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
        # Get user ID from JWT token
        user_id = verify_user_from_request(request)

        # Fetch classification history from database
        history = list(waste_collection.find({"userId": user_id}).sort("createdAt", -1))

        # Sanitize documents (ObjectId -> str, datetime -> ISO)
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
        # Check MongoDB connection
        if waste_collection is None:
            raise HTTPException(
                status_code=503, detail="Database connection unavailable"
            )

        user_id = verify_user_from_request(request)

        # Convert entry_id string to ObjectId for MongoDB query
        try:
            object_id = ObjectId(entry_id)
        except Exception as e:
            print(f"Invalid ObjectId format: {entry_id} - {e}")
            raise HTTPException(status_code=400, detail="Invalid entry ID format")

        # Fetch the entry BEFORE deletion to get filePath for cleanup
        try:
            entry = waste_collection.find_one({"_id": object_id, "userId": user_id})
        except Exception as e:
            print(f"Database error retrieving entry: {e}")
            raise HTTPException(
                status_code=503, detail="Database error retrieving entry"
            )

        if entry is None:
            raise HTTPException(
                status_code=404, detail="Classification entry not found"
            )

        # Delete the entry from the database
        try:
            result = waste_collection.delete_one({"_id": object_id, "userId": user_id})
        except Exception as e:
            print(f"Database error deleting entry: {e}")
            raise HTTPException(
                status_code=503, detail="Failed to delete from database"
            )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, detail="Failed to delete classification entry"
            )

        # Delete image file from local storage
        if entry.get("filePath"):
            try:
                if os.path.exists(entry["filePath"]):
                    os.remove(entry["filePath"])
                    print(f"✓ Image file deleted: {entry['filePath']}")
                else:
                    print(f"⚠ Image file not found: {entry['filePath']}")
            except PermissionError:
                print(f"✗ Permission denied deleting file: {entry['filePath']}")
                raise HTTPException(
                    status_code=500, detail="Permission denied deleting image file"
                )
            except Exception as e:
                print(f"✗ Error deleting image file at {entry['filePath']}: {e}")
                raise HTTPException(
                    status_code=500, detail="Failed to delete image file"
                )
        else:
            print("⚠ No file path found in entry")

        return {"status": "success", "message": "Classification entry deleted"}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error deleting classification entry: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
