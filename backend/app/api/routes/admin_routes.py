# type: ignore
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from app.utils.auth_utils import verify_admin_from_request
from app.models.dataset import Dataset
from app.models.admin_models import (
    BatchUploadRequest,
    DeleteDatasetRequest,
    UpdateDatasetRequest,
)
from app.database.collections import dataset_collection
from app.services.admin_dataset_service import (
    validate_and_process_image,
    parse_file_paths_json,
    save_image_file,
    delete_stored_file,
    increment_version,
)
from app.services.admin_model_service import (
    training_status,
    evaluation_status,
    run_training_logic,
    run_evaluation_logic,
)
from datetime import datetime
import json
from bson import ObjectId

router = APIRouter()

# ------------------------------- Dataset Routes -------------------------------


@router.post("/admin/dataset/upload")
async def upload_dataset(request: Request, payload: BatchUploadRequest):
    try:
        verify_admin_from_request(request)

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
            validated = validate_and_process_image(image_data, errors)
            if validated is None:
                continue

            file_bytes = validated["file_bytes"]
            file_ext = validated["file_ext"]
            label = validated["label"]
            filename = validated["filename"]

            try:
                _, new_filename, normalized_file_path = save_image_file(
                    label, file_bytes, file_ext
                )

                # Collect file path and upload result
                all_file_paths.append(
                    {
                        "filePath": normalized_file_path,
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
                errors.append({"file": filename, "error": str(e)})

        # Create single database entry for this batch upload if there are successful uploads
        if uploaded_results:
            # Use the dataset name provided by the admin
            dataset_name = payload.datasetName.strip()
            dataset_description = (
                payload.datasetDescription.strip()
                if payload.datasetDescription is not None
                else None
            )

            # Get the latest version for this dataset
            # Use find with sort to get the most recent version
            existing_dataset = list(
                dataset_collection.find({"name": dataset_name})
                .sort("uploadDate", -1)
                .limit(1)
            )
            if existing_dataset:
                # Raise error if dataset with same name already exists to prevent confusion
                raise HTTPException(
                    status_code=400,
                    detail=f"A dataset with the name '{dataset_name}' already exists. Please choose a different name.",
                )

            uploadedDataset = Dataset(
                name=dataset_name,
                description=dataset_description,
                version="1.0",
                filePath=json.dumps(all_file_paths),  # Store as proper JSON
                imageCount=len(uploaded_results),  # Count of successful uploads
                uploadDate=datetime.now(),
                lastUpdated=datetime.now(),
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


@router.put("/admin/dataset/update")
async def update_dataset(request: Request, payload: UpdateDatasetRequest):
    try:
        verify_admin_from_request(request)
        objectId = ObjectId(payload.dataset_id)
        requestedDataset = dataset_collection.find_one({"_id": objectId})
        # If the ID doesn't exist, it returns a 404 Not Found error.
        if not requestedDataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # -- Preparing the fields to update --
        update_fields = {}

        if payload.new_name:
            update_fields["name"] = payload.new_name.strip()
        if payload.version is not None:
            update_fields["version"] = payload.version
        if payload.datasetDescription is not None:
            update_fields["description"] = payload.datasetDescription.strip()

        # Handle image deletion and uploads
        existing_file_paths = []
        if requestedDataset.get("filePath"):
            existing_file_paths = parse_file_paths_json(requestedDataset["filePath"])

        # Delete specified images from disk and database
        if payload.images_to_delete is not None and len(payload.images_to_delete) > 0:
            # Paths to delete are already in normalized format (with /)
            paths_to_delete_normalized = set(payload.images_to_delete)

            # Delete specified images from disk
            for file_path in paths_to_delete_normalized:
                try:
                    delete_stored_file(file_path)
                except Exception as e:
                    print(f"Error deleting file {file_path}: {e}")

            # Remove deleted images from the database
            existing_file_paths = [
                item
                for item in existing_file_paths
                if not (
                    (
                        isinstance(item, dict)
                        and item.get("filePath") in paths_to_delete_normalized
                    )
                    or (isinstance(item, str) and item in paths_to_delete_normalized)
                )
            ]
            print(
                f"✓ Removed {len(payload.images_to_delete)} image(s) from database. Remaining: {len(existing_file_paths)}"
            )

        # Handle Image Uploads using the shared validation helper
        new_file_paths = []
        upload_errors = []

        if payload.images is not None and len(payload.images) > 0:
            for image_data in payload.images:
                validated = validate_and_process_image(image_data, upload_errors)
                if validated is None:
                    continue

                file_bytes = validated["file_bytes"]
                file_ext = validated["file_ext"]
                label = validated["label"]
                filename = validated["filename"]

                try:
                    _, _, normalized_file_path = save_image_file(
                        label, file_bytes, file_ext
                    )

                    new_file_paths.append(
                        {
                            "filePath": normalized_file_path,
                            "label": label,
                            "originalFilename": filename,
                        }
                    )
                except Exception as e:
                    upload_errors.append({"file": filename, "error": str(e)})

            # Merge old and new file paths
            all_file_paths = existing_file_paths + new_file_paths
            update_fields["filePath"] = json.dumps(all_file_paths)
            update_fields["imageCount"] = len(all_file_paths)
            update_fields["lastUpdated"] = datetime.now()
            # Auto-increment version on upload if not explicitly provided
            if payload.version is None:
                current_version = requestedDataset.get("version", "1.0")
                update_fields["version"] = increment_version(current_version)

        elif payload.images_to_delete is not None and len(payload.images_to_delete) > 0:
            # Handle deletion without new uploads
            update_fields["filePath"] = json.dumps(existing_file_paths)
            update_fields["imageCount"] = len(existing_file_paths)
            update_fields["lastUpdated"] = datetime.now()
            # Auto-increment version on deletion
            current_version = requestedDataset.get("version", "1.0")
            update_fields["version"] = increment_version(current_version)

        # Execute database update
        if update_fields:
            dataset_collection.update_one({"_id": objectId}, {"$set": update_fields})

            response = {
                "message": "Dataset updated successfully",
                "status": "completed",
            }
            if upload_errors:
                response["errors"] = upload_errors
            return response
        else:
            raise HTTPException(status_code=400, detail="No valid fields to update")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating dataset: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/admin/datasets")
def get_datasets(request: Request):
    try:
        verify_admin_from_request(request)

        # Logic to retrieve datasets goes here
        datasets = list(dataset_collection.find())
        for ds in datasets:
            ds["_id"] = str(
                ds["_id"]
            )  # Convert ObjectId to string for JSON serialization
        return {"message": "Datasets retrieved successfully", "datasets": datasets}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving datasets: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/admin/dataset/{dataset_id}")
def get_dataset_details(request: Request, dataset_id: str):
    try:
        verify_admin_from_request(request)
        object_id = ObjectId(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid dataset ID format")

    dataset = dataset_collection.find_one({"_id": object_id})

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    dataset["_id"] = str(
        dataset["_id"]
    )  # Convert ObjectId to string for JSON serialization

    return {"message": "Dataset details retrieved successfully", "dataset": dataset}


@router.delete("/admin/dataset/delete")
def delete_dataset(request: Request, payload: DeleteDatasetRequest):
    try:
        verify_admin_from_request(request)
        # Convert the string dataset_id to ObjectId
        object_id = ObjectId(payload.dataset_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid dataset ID format")

    # IMPORTANT: Retrieve dataset FIRST before deleting from database!
    dataset = dataset_collection.find_one({"_id": object_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Delete associated files from the filesystem
    if dataset.get("filePath"):
        file_paths = parse_file_paths_json(dataset["filePath"])

        deleted_count = 0
        for file_info in file_paths:
            try:
                # Handle both dict and string formats
                if isinstance(file_info, dict):
                    file_path = file_info.get("filePath")
                else:
                    file_path = file_info

                if file_path:
                    if delete_stored_file(file_path):
                        deleted_count += 1
            except Exception as file_error:
                print(f"✗ Error deleting file {file_path}: {file_error}")

        print(f"✓ Successfully deleted {deleted_count} image files")
    else:
        print(f"No file paths found in dataset")

    # Now delete the dataset from the database
    result = dataset_collection.delete_one({"_id": object_id})

    return {
        "message": "Dataset deleted successfully",
        "result": str(result.deleted_count),
    }


# ------------------------------- Model Training Routes -------------------------------


@router.post("/admin/model/retrain")
async def retrain_model(request: Request, background_tasks: BackgroundTasks):
    verify_admin_from_request(request)

    if training_status["is_training"]:
        return {
            "status": "error",
            "message": "Training is already in progress. Please wait for it to complete.",
        }

    # This starts the 'offline' training without blocking the API
    background_tasks.add_task(run_training_logic)

    return {"message": "Retraining started offline. Check status for updates."}


@router.get("/admin/model/status")
def get_model_status(request: Request):
    verify_admin_from_request(request)

    return training_status


# ------------------------------- Model Evaluation Routes -------------------------------


@router.post("/admin/model/evaluate")
async def evaluate_model_endpoint(request: Request, background_tasks: BackgroundTasks):
    """Trigger model evaluation on saved model."""
    verify_admin_from_request(request)

    if evaluation_status["is_evaluating"]:
        return {
            "status": "error",
            "message": "Evaluation is already in progress. Please wait for it to complete.",
        }

    # Start evaluation in background
    background_tasks.add_task(run_evaluation_logic)

    return {"message": "Evaluation started. Check status for updates."}


@router.get("/admin/model/evaluation/status")
def get_evaluation_status(request: Request):
    """Get the current evaluation progress."""
    verify_admin_from_request(request)

    return evaluation_status


@router.get("/admin/model/evaluation/latest")
def get_latest_evaluation(request: Request):
    try:
        verify_admin_from_request(request)
        # Get the latest evaluation result
        from app.database.collections import model_evaluation_collection

        latest_evaluation = model_evaluation_collection.find_one(
            sort=[("evaluationDate", -1)]
        )

        if not latest_evaluation:
            raise HTTPException(
                status_code=404,
                detail="No evaluation results found. Please run model retraining first.",
            )

        # Convert ObjectId to string for JSON serialization
        latest_evaluation["_id"] = str(latest_evaluation["_id"])
        if isinstance(latest_evaluation.get("evaluationDate"), str):
            latest_evaluation["evaluationDate"] = latest_evaluation["evaluationDate"]
        else:
            latest_evaluation["evaluationDate"] = latest_evaluation[
                "evaluationDate"
            ].isoformat()

        return latest_evaluation
    except HTTPException:
        # Re-raise HTTP exceptions (404, etc.) without catching them
        raise
    except Exception as e:
        print(f"Error fetching evaluation results: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch evaluation results"
        )


# ------------------------------- Classification History Route -------------------------------


@router.get("/admin/classification/history")
def get_classification_history(request: Request):
    try:
        # Verify admin access
        verify_admin_from_request(request)

        from app.database.collections import waste_collection

        # Get all classification history
        classification_history = list(waste_collection.find().sort("createdAt", -1))

        # Convert ObjectId to string for JSON serialization
        for entry in classification_history:
            entry["_id"] = str(entry["_id"])
            if "userId" in entry:
                entry["userId"] = str(entry["userId"])

        return {"status": "success", "history": classification_history}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching classification history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete("/admin/classification/history/{entry_id}")
def delete_classification_entry_admin(entry_id: str, request: Request):
    try:
        # Verify admin access
        verify_admin_from_request(request)

        from app.database.collections import waste_collection
        from bson import ObjectId

        # Check MongoDB connection
        if waste_collection is None:
            raise HTTPException(
                status_code=503, detail="Database connection unavailable"
            )

        # Convert entry_id string to ObjectId for MongoDB query
        try:
            object_id = ObjectId(entry_id)
        except Exception as e:
            print(f"Invalid ObjectId format: {entry_id} - {e}")
            raise HTTPException(status_code=400, detail="Invalid entry ID format")

        # Fetch the entry BEFORE deletion to get filePath for cleanup
        try:
            entry = waste_collection.find_one({"_id": object_id})
        except Exception as e:
            print(f"Database error retrieving entry: {e}")
            raise HTTPException(
                status_code=503, detail="Database error retrieving entry"
            )

        if entry is None:
            raise HTTPException(
                status_code=404, detail="Classification entry not found"
            )

        # Delete the entry from the database (no user ownership check for admin)
        try:
            result = waste_collection.delete_one({"_id": object_id})
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
                delete_stored_file(entry["filePath"])
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

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error deleting classification entry: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
