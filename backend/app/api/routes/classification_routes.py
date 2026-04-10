from fastapi import APIRouter, HTTPException, UploadFile
from app.ai.model_loader import model
from app.ai.preprocess import preprocess_image
from app.ai.predict import predict_image

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
async def analyze_classification_result(file: UploadFile):
    try:
        # Upload file and preprocess
        laodedModel = model  # Ensure model is loaded
        image_bytes = await file.read()
        preprocessedImage = preprocess_image(image_bytes)
        predicted_class_label, confidence = predict_image(
            preprocessedImage, laodedModel, class_labels
        )
        return {"label": predicted_class_label, "confidence": confidence}
    except HTTPException as e:
        raise e  # Re-raise HTTP exceptions to be handled by FastAPI
    except Exception as e:
        print(f"Database error during classification analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
