from fastapi import APIRouter, HTTPException, UploadFile, Request
from app.ai.model_loader import model
from app.ai.preprocess import preprocess_image
from app.ai.predict import predict_image
from app.models.waste import Waste
from app.database.connection import db
from app.api.routes.auth_routes import get_user_id_from_token

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
        # Upload file and preprocess
        laodedModel = model  # Ensure model is loaded
        image_bytes = await file.read()
        preprocessedImage = preprocess_image(image_bytes)
        predicted_class_label, confidence = predict_image(
            preprocessedImage, laodedModel, class_labels
        )
        # get user ID from JWT token
        # token
        jwt_token = request.cookies.get("access_token")
        if not jwt_token:
            raise HTTPException(status_code=401, detail="Access token not found")
        user_id = get_user_id_from_token(jwt_token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid access token")

        # Save classification result to database
        waste_entry = Waste(
            userId=user_id,  # Use the user ID from the JWT token
            filePath=f"/path/to/uploaded/{file.filename}",  # Replace with actual file
            uploadDate="2024-01-01",  # Replace with actual upload date
        )
        db.waste.insert_one(waste_entry.dict())

        return {"label": predicted_class_label, "confidence": confidence}

    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions to be handled by FastAPI
    except Exception as e:
        print(f"Error during classification analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
