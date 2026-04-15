#type: ignore
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from tensorflow import keras
from keras import layers, models
from keras.applications import MobileNetV2
from keras.preprocessing.image import ImageDataGenerator
from app.services.admin_check_service import checkAdmin
from app.services.model_evaluation_service import (
    evaluate_model,
    save_evaluation_to_database,
    save_confusion_matrix_locally,
)
from app.models.dataset import Dataset
from app.models.admin_models import BatchUploadRequest, DeleteDatasetRequest
from app.database.collections import dataset_collection, model_evaluation_collection
import os
import shutil
from uuid import uuid4
from datetime import datetime
import base64
from bson import ObjectId
import time


router = APIRouter()

# Allowed labels (same as model)
ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]

BASE_DATASET_PATH = "dataset/original"
CUSTOM_DATASET_PATH = "dataset/custom"

# Training status tracking
training_status = {
    "is_training": False,
    "progress": 0,
    "status": "idle",
    "message": "No training in progress",
    "started_at": None,
    "epoch": 0,
    "total_epochs": 0,
}


def run_training_logic():
    # Merge original and custom datasets, split into train/test, and retrain the model.
    global training_status

    # Configuration
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    EPOCHS = 10
    TRAIN_SPLIT = 0.7  # 70% train, 30% test

    # Record training start time
    training_start_time = time.time()

    # Create temporary combined dataset directory
    combined_dataset_path = "dataset/combined_temp"
    train_dir = os.path.join(combined_dataset_path, "train")
    test_dir = os.path.join(combined_dataset_path, "test")

    # Initialize training status
    training_status["is_training"] = True
    training_status["status"] = "preparing_data"
    training_status["message"] = "Preparing dataset..."
    training_status["started_at"] = datetime.utcnow().isoformat()
    training_status["progress"] = 5

    try:
        # Clean up if combined dataset already exists
        if os.path.exists(combined_dataset_path):
            print(f"Removing existing combined dataset...")
            shutil.rmtree(combined_dataset_path)

        print(f"Creating combined dataset from original and custom folders...")

        # Create train and test directories for each label
        for label in ALLOWED_LABELS:
            os.makedirs(os.path.join(train_dir, label), exist_ok=True)
            os.makedirs(os.path.join(test_dir, label), exist_ok=True)

        # Merge images from both original and custom datasets
        all_images = {label: [] for label in ALLOWED_LABELS}

        # Collect images from original dataset
        for label in ALLOWED_LABELS:
            original_label_path = os.path.join(BASE_DATASET_PATH, label)
            if os.path.exists(original_label_path):
                for img_file in os.listdir(original_label_path):
                    img_path = os.path.join(original_label_path, img_file)
                    if os.path.isfile(img_path):
                        all_images[label].append(img_path)

        # Collect images from custom dataset
        for label in ALLOWED_LABELS:
            custom_label_path = os.path.join(CUSTOM_DATASET_PATH, label)
            if os.path.exists(custom_label_path):
                for img_file in os.listdir(custom_label_path):
                    img_path = os.path.join(custom_label_path, img_file)
                    if os.path.isfile(img_path):
                        all_images[label].append(img_path)

        # Split images into train and test and copy them
        total_images = 0
        for label, img_paths in all_images.items():
            split_index = int(len(img_paths) * TRAIN_SPLIT)

            # Copy training images
            for i, img_path in enumerate(img_paths[:split_index]):
                try:
                    dest_path = os.path.join(
                        train_dir, label, os.path.basename(img_path)
                    )
                    shutil.copy2(img_path, dest_path)
                except Exception as e:
                    print(f"Error copying training image {img_path}: {e}")

            # Copy test images
            for i, img_path in enumerate(img_paths[split_index:]):
                try:
                    dest_path = os.path.join(
                        test_dir, label, os.path.basename(img_path)
                    )
                    shutil.copy2(img_path, dest_path)
                except Exception as e:
                    print(f"Error copying test image {img_path}: {e}")

            total_images += len(img_paths)
            print(
                f"  {label}: {len(img_paths)} images (train: {split_index}, test: {len(img_paths) - split_index})"
            )

        print(f"\nTotal images collected: {total_images}")
        print(f"Train directory: {train_dir}")
        print(f"Test directory: {test_dir}")

        training_status["message"] = "Loading data into memory..."
        training_status["progress"] = 25

        # Create data generators
        train_datagen = ImageDataGenerator(
            rescale=1.0 / 255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode="nearest",
        )

        test_datagen = ImageDataGenerator(rescale=1.0 / 255)

        # Load data from directories
        train_data = train_datagen.flow_from_directory(
            train_dir,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
        )

        test_data = test_datagen.flow_from_directory(
            test_dir,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
            shuffle=False,
        )

        print(f"\nDataset Info:")
        print(f"  Number of classes: {train_data.num_classes}")
        print(f"  Classes: {list(train_data.class_indices.keys())}")

        training_status["message"] = "Building model..."
        training_status["progress"] = 40

        # Build model
        base_model = MobileNetV2(
            weights="imagenet", include_top=False, input_shape=(224, 224, 3)
        )

        base_model.trainable = False

        model = models.Sequential(
            [
                base_model,
                layers.GlobalAveragePooling2D(),
                layers.Dense(256, activation="relu"),
                layers.Dropout(0.5),
                layers.Dense(128, activation="relu"),
                layers.Dropout(0.3),
                layers.Dense(train_data.num_classes, activation="softmax"),
            ]
        )

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

        print("\nModel compiled successfully!")
        print(f"Total parameters: {model.count_params()}")

        training_status["status"] = "training"
        training_status["message"] = "Training model..."
        training_status["total_epochs"] = EPOCHS
        training_status["epoch"] = 0
        training_status["progress"] = 50

        # Train model
        print(f"\nTraining model for {EPOCHS} epochs...")
        early_stopping = keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=5, restore_best_weights=True
        )

        # Custom callback to track progress
        class StatusCallback(keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs=None):
                training_status["epoch"] = epoch + 1
                progress = 50 + (epoch + 1) / EPOCHS * 40  # Progress from 50% to 90%
                training_status["progress"] = int(progress)
                training_status["message"] = f"Training... Epoch {epoch + 1}/{EPOCHS}"
                if logs:
                    training_status[
                        "message"
                    ] += f" - Loss: {logs.get('loss', 'N/A'):.4f}"

        model.fit(
            train_data,
            epochs=EPOCHS,
            validation_data=test_data,
            callbacks=[early_stopping, StatusCallback()],
            verbose=1,
        )

        # Calculate training time
        training_time = time.time() - training_start_time

        # Save model first
        training_status["message"] = "Saving model..."
        training_status["progress"] = 90

        model_path = os.path.join("model", "waste_classifier_model.keras")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        model.save(model_path)
        print(f"\n✓ Model saved successfully to: {model_path}")

        # Evaluate model on test data
        training_status["message"] = "Evaluating model..."
        training_status["progress"] = 92

        evaluation_doc = evaluate_model(model, test_data)
        evaluation_doc["trainingTime"] = float(training_time)

        # Save confusion matrix locally
        training_status["message"] = "Saving confusion matrix..."
        training_status["progress"] = 96
        save_confusion_matrix_locally(
            evaluation_doc["confusionMatrix"],
            evaluation_doc["classLabels"],
            evaluation_doc["modelVersion"],
        )

        # Save evaluation results to database
        training_status["message"] = "Saving results to database..."
        training_status["progress"] = 98

        save_evaluation_to_database(evaluation_doc)

        training_status["status"] = "completed"
        training_status["message"] = "Training completed successfully!"
        training_status["progress"] = 100
        training_status["is_training"] = False

    except Exception as e:
        print(f"Error during training: {e}")
        training_status["status"] = "error"
        training_status["message"] = f"Training failed: {str(e)}"
        training_status["is_training"] = False
        raise
    finally:
        # Clean up temporary combined dataset
        if os.path.exists(combined_dataset_path):
            print(f"\nCleaning up temporary combined dataset...")
            shutil.rmtree(combined_dataset_path)


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
                label_folder = os.path.join(CUSTOM_DATASET_PATH, label)
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


@router.post("/admin/model/retrain")
async def retrain_model(request: Request, background_tasks: BackgroundTasks):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

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
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    return training_status


@router.get("/admin/model/evaluation/latest")
def get_latest_evaluation(request: Request):
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    try:
        # Get the latest evaluation result
        from app.database.collections import model_evaluation_collection

        latest_evaluation = model_evaluation_collection.find_one(
            sort=[("evaluationDate", -1)]
        )

        if not latest_evaluation:
            raise HTTPException(status_code=404, detail="No evaluation results found")

        # Convert ObjectId to string for JSON serialization
        latest_evaluation["_id"] = str(latest_evaluation["_id"])
        if isinstance(latest_evaluation.get("evaluationDate"), str):
            latest_evaluation["evaluationDate"] = latest_evaluation["evaluationDate"]
        else:
            latest_evaluation["evaluationDate"] = latest_evaluation[
                "evaluationDate"
            ].isoformat()

        return latest_evaluation
    except Exception as e:
        print(f"Error fetching evaluation results: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to fetch evaluation results"
        )


# @router.get("/admin/logs")
# def get_logs(request: Request):
#     if not checkAdmin(request):
#         raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

#     # Logic to get logs goes here
#     # For example, you might call a function like `get_logs_function()`

#     return {"message": "Logs retrieved successfully"}


# @router.get("/admin/model/evaluation")
# def evaluate_model(request: Request):
#     if not checkAdmin(request):
#         raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

#     # Logic to evaluate the model goes here
#     # For example, you might call a function like `evaluate_model_function()`

#     return {"message": "Model evaluation completed successfully"}
