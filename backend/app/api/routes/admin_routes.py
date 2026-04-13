from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from app.services.admin_check_service import checkAdmin
from app.database.connection import db
from app.database.collections import dataset_collection
import os
from uuid import uuid4
from datetime import datetime

from app.api.routes.auth_routes import get_user_id_from_token
from app.models import dataset


router = APIRouter()

# Allowed labels (same as model)
ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]

BASE_DATASET_PATH = "dataset/custom"


# @router.post("/admin/model/retrain")
# def retrain_model(request: Request):
#     if not checkAdmin(request):
#         raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

#     # Logic to retrain the model goes here
#     # For example, you might call a function like `retrain_model_function()`

#     return {"message": "Model retraining initiated successfully"}


@router.post("/admin/dataset/upload")
async def upload_dataset(
    request: Request, file: UploadFile = File(...), label: str = Form(...)
):
    try:
        checkAdmin(request)
        # Validate label
        if label not in ALLOWED_LABELS:
            raise HTTPException(status_code=400, detail="Invalid label")

        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="Invalid file type. File must be an image."
            )

        # Create label folder if it doesn't exist
        label_folder = os.path.join(BASE_DATASET_PATH, label)
        os.makedirs(label_folder, exist_ok=True)

        # Save file locally
        if not file.filename or "." not in file.filename:
            raise HTTPException(status_code=400, detail="Invalid file name")

        file_ext = file.filename.rsplit(".", 1)[-1].lower()
        filename = f"{uuid4()}.{file_ext}"

        filePath = os.path.join(label_folder, filename)
        with open(filePath, "wb") as f:
            content = await file.read()
            f.write(content)

        # Save metadata to database
        metadata = {
            "filePath": filePath,
            "label": label,
            "uploadedBy": "admin",
            "createdAt": datetime.utcnow().isoformat(),
        }
        dataset_collection.insert_one(metadata)
        return {
            "status": "success",
            "message": "Dataset uploaded successfully",
            "label": label,
        }
    except HTTPException:
        raise  # Let HTTP exceptions pass through
    except Exception as e:
        print(f"Error uploading dataset: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


"""
@router.get("/admin/dataset")
def get_datasets(request: Request):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    # Logic to get datasets goes here
    # For example, you might call a function like `get_datasets_function()`

    return {"message": "Datasets retrieved successfully"}


@router.delete("/admin/dataset/delete")
def delete_dataset(request: Request, dataset_id: str):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    # Logic to delete dataset goes here
    # For example, you might call a function like `delete_dataset_function(dataset_id)`

    return {"message": f"Dataset with id {dataset_id} deleted successfully"}


@router.get("/admin/model/status")
def get_model_status(request: Request):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    # Logic to get model status goes here
    # For example, you might call a function like `get_model_status_function()`

    return {"message": "Model status retrieved successfully"}


@router.get("/admin/logs")
def get_logs(request: Request):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    # Logic to get logs goes here
    # For example, you might call a function like `get_logs_function()`

    return {"message": "Logs retrieved successfully"}


@router.get("/admin/model/evaluation")
def evaluate_model(request: Request):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    # Logic to evaluate the model goes here
    # For example, you might call a function like `evaluate_model_function()`

    return {"message": "Model evaluation completed successfully"}
"""
