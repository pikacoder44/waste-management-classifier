from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from app.services.admin_check_service import checkAdmin
from app.models.dataset import Dataset
from app.database.collections import dataset_collection
import os
from uuid import uuid4
from datetime import datetime
from typing import List
from pydantic import BaseModel
import base64

from app.api.routes.auth_routes import get_user_id_from_token
from app.models import dataset


class ImageUpload(BaseModel):
    filename: str
    label: str
    fileData: str  # Base64 encoded image data


class BatchUploadRequest(BaseModel):
    images: List[ImageUpload]


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
async def upload_dataset(request: Request, payload: BatchUploadRequest):
    try:
        checkAdmin(request)

        if len(payload.images) == 0:
            raise HTTPException(
                status_code=400, detail="At least one image must be provided"
            )

        uploaded_results = []
        errors = []
        all_file_paths = []  # Store all file paths for this batch

        # Process each image with its corresponding label
        for image_data in payload.images:
            try:
                label = image_data.label
                filename = image_data.filename
                file_content = image_data.fileData

                # Validate label
                if label not in ALLOWED_LABELS:
                    errors.append(
                        {
                            "file": filename,
                            "error": f"Invalid label: {label}. Allowed labels are: {', '.join(ALLOWED_LABELS)}",
                        }
                    )
                    continue

                # Validate filename
                if not filename or "." not in filename:
                    errors.append({"file": filename, "error": "Invalid file name"})
                    continue

                # Validate file extension
                file_ext = filename.rsplit(".", 1)[-1].lower()
                valid_extensions = ["jpg", "jpeg", "png", "gif", "webp"]
                if file_ext not in valid_extensions:
                    errors.append(
                        {
                            "file": filename,
                            "error": f"Invalid file extension. Allowed: {', '.join(valid_extensions)}",
                        }
                    )
                    continue

                try:
                    # Decode base64 file data
                    file_bytes = base64.b64decode(file_content)
                except Exception as e:
                    errors.append(
                        {"file": filename, "error": "Invalid base64 encoded file data"}
                    )
                    continue

                # Create label folder if it doesn't exist
                label_folder = os.path.join(BASE_DATASET_PATH, label)
                os.makedirs(label_folder, exist_ok=True)

                # Save file locally
                new_filename = f"{uuid4()}.{file_ext}"
                filePath = os.path.join(label_folder, new_filename)

                with open(filePath, "wb") as f:
                    f.write(file_bytes)

                # Collect file path and upload result
                all_file_paths.append(
                    {
                        "filePath": filePath,
                        "label": label,
                        "originalFilename": filename,
                    }
                )

                uploaded_results.append(
                    {
                        "originalFilename": filename,
                        "savedFilename": new_filename,
                        "label": label,
                        "status": "success",
                    }
                )

            except Exception as e:
                errors.append({"file": image_data.filename, "error": str(e)})

        # Create single database entry for this batch upload if there are successful uploads
        if uploaded_results:
            # Create a generic name with timestamp
            dataset_name = (
                f"Dataset Update {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
            )

            uploadedDataset = Dataset(
                name=dataset_name,
                description=f"Batch upload containing {len(uploaded_results)} image(s)",
                version="1.0",
                filePath=str(all_file_paths),  # Store all file paths as string
                label="mixed",  # Multiple labels in one upload
                imageCount=len(uploaded_results),  # Count of successful uploads
                uploadDate=datetime.utcnow(),
                lastUpdated=datetime.utcnow(),
            )
            dataset_collection.insert_one(uploadedDataset.dict())

        # Prepare response
        response = {
            "status": "completed",
            "totalFiles": len(payload.images),
            "successfulUploads": len(uploaded_results),
            "failedUploads": len(errors),
            "uploaded": uploaded_results,
        }

        if errors:
            response["errors"] = errors

        return response

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
