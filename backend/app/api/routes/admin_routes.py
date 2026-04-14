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
from bson import ObjectId

from app.api.routes.auth_routes import get_user_id_from_token
from app.models import dataset


class ImageUpload(BaseModel):
    filename: str
    label: str
    fileData: str  # Base64 encoded image data


class BatchUploadRequest(BaseModel):
    datasetName: str
    images: List[ImageUpload]


class DeleteDatasetRequest(BaseModel):
    dataset_id: str


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

        # Validate dataset name
        if not payload.datasetName or not payload.datasetName.strip():
            raise HTTPException(status_code=400, detail="Dataset name is required")

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
            # Use the dataset name provided by the admin
            dataset_name = payload.datasetName.strip()

            # Get the latest version for this dataset
            # Use find with sort to get the most recent version
            latest_dataset = list(
                dataset_collection.find({"name": dataset_name})
                .sort("uploadDate", -1)
                .limit(1)
            )
            existing_dataset = latest_dataset[0] if latest_dataset else None

            if existing_dataset and "version" in existing_dataset:
                try:
                    # Parse current version and increment by 0.1
                    current_version = float(existing_dataset["version"])
                    new_version = current_version + 0.1
                    new_version = f"{new_version:.1f}"
                    print(
                        f"Found existing dataset version {current_version}, updating to {new_version}"
                    )
                except Exception as e:
                    # If parsing fails, start from 1.0
                    print(f"Error parsing version: {e}, starting from 1.0")
                    new_version = "1.0"
            else:
                # First upload of this dataset
                print(
                    f"No existing dataset found with name '{dataset_name}', starting from 1.0"
                )
                new_version = "1.0"

            print(f"Using version: {new_version} for dataset: {dataset_name}")

            uploadedDataset = Dataset(
                name=dataset_name,
                description=f"Batch upload containing {len(uploaded_results)} image(s)",
                version=new_version,
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


@router.get("/admin/datasets")
def get_datasets(request: Request):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    # Logic to retrieve datasets goes here
    datasets = list(dataset_collection.find())
    for ds in datasets:
        ds["_id"] = str(ds["_id"])  # Convert ObjectId to string for JSON serialization
    return {"message": "Datasets retrieved successfully", "datasets": datasets}


@router.delete("/admin/dataset/delete")
def delete_dataset(request: Request, payload: DeleteDatasetRequest):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    try:
        # Convert the string dataset_id to ObjectId
        object_id = ObjectId(payload.dataset_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid dataset ID format")

    # Delete the dataset
    result = dataset_collection.delete_one({"_id": object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return {"message": "Dataset deleted successfully"}


"""



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
