# type: ignore
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from app.services.admin_check_service import checkAdmin
from app.services.model_evaluation_service import (
    evaluate_model,
    save_evaluation_to_database,
)
from app.services.split_dataset_services import ensure_split_dataset
from app.models.dataset import Dataset
from app.models.admin_models import BatchUploadRequest, DeleteDatasetRequest
from app.database.collections import dataset_collection
import os
import shutil
from uuid import uuid4
from datetime import datetime
import base64
from bson import ObjectId


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

# Evaluation status tracking (separate from training)
evaluation_status = {
    "is_evaluating": False,
    "progress": 0,
    "status": "idle",
    "message": "No evaluation in progress",
    "started_at": None,
}


def run_training_logic():
    # Merge original and custom datasets, split into train/test, and retrain the model.
    global training_status

    # Configuration
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    EPOCHS = 10
    TRAIN_SPLIT = 0.7  # 70% train, 30% test

    # Initialize training status
    training_status["is_training"] = True
    training_status["status"] = "preparing_data"
    training_status["message"] = "Preparing dataset..."
    training_status["started_at"] = datetime.utcnow().isoformat()
    training_status["progress"] = 5

    try:
        # Ensure split dataset is current
        print(f"Checking if train split exists and is current...")
        split_info = ensure_split_dataset("train", TRAIN_SPLIT)
        train_dir = split_info["train_dir"]
        test_dir = split_info["test_dir"]
        combined_dataset_path = split_info["split_path"]

        training_status["message"] = "Loading data into memory..."
        training_status["progress"] = 25

        # Data Augmentation - this makes the model more robust and can help with small datasets to prevent overfitting
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
        # Add custom layers on top of the base model
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
        """
        Updates:
            # epoch number
            # progress %
            # loss
        This is how frontend gets live updates
        """

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

        # Save model first
        training_status["message"] = "Saving model..."
        training_status["progress"] = 95

        model_path = os.path.join("model", "waste_classifier_model.keras")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        model.save(model_path)
        print(f"\n✓ Model saved successfully to: {model_path}")

        training_status["status"] = "completed"
        training_status["message"] = (
            "Training completed successfully! Run evaluation to see metrics."
        )
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


def run_evaluation_logic():

    global evaluation_status

    print("\n" + "=" * 80)
    print("🚀 STARTING EVALUATION PROCESS")
    print("=" * 80)

    evaluation_status["is_evaluating"] = True
    evaluation_status["status"] = "running"
    evaluation_status["message"] = "Loading model..."
    evaluation_status["started_at"] = datetime.utcnow().isoformat()
    evaluation_status["progress"] = 10
    print(f"✓ Evaluation status initialized (progress: 10%)")

    # Initialize cleanup path before try
    eval_dataset_path = None

    try:
        # Configuration
        IMG_SIZE = (224, 224)
        BATCH_SIZE = 32
        TRAIN_SPLIT = 0.7  # Must match training split to evaluate on same test set

        # Load the saved model
        model_path = os.path.join("model", "waste_classifier_model.keras")
        print(f"\n[1/4] Checking if model exists: {model_path}")
        if not os.path.exists(model_path):
            print(f"❌ Model not found at: {model_path}")
            evaluation_status["status"] = "error"
            evaluation_status["message"] = (
                "Model not found. Please train the model first."
            )
            evaluation_status["is_evaluating"] = False
            evaluation_status["progress"] = 0
            return

        print(f"✓ Model file exists")
        print(f"[2/4] Loading model from: {model_path}")
        model = keras.models.load_model(model_path)
        print(f"✓ Model loaded successfully")

        # Ensure evaluation split is current using SAME split ratio as training
        # This ensures we evaluate on the SAME test data (30% holdout) that model never trained on
        print(f"[3/4] Checking evaluation dataset...")
        evaluation_status["message"] = "Checking evaluation dataset..."
        evaluation_status["progress"] = 30

        split_info = ensure_split_dataset("eval", train_split=TRAIN_SPLIT)
        eval_test_dir = split_info[
            "test_dir"
        ]  # Uses test_dir with 30% holdout data (unseen by model)
        eval_dataset_path = split_info["split_path"]

        print(f"✓ Evaluation dataset ready (using same test split as training)")
        print(
            f"  Train split: {TRAIN_SPLIT*100:.0f}% | Test split: {(1-TRAIN_SPLIT)*100:.0f}%"
        )

        # Create test data generator
        test_datagen = ImageDataGenerator(rescale=1.0 / 255)

        test_data = test_datagen.flow_from_directory(
            eval_test_dir,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
            shuffle=False,
        )
        print(f"✓ Test data generator created")

        # Get accurate sample count from generator
        actual_samples = test_data.samples
        total_batches = (
            actual_samples + BATCH_SIZE - 1
        ) // BATCH_SIZE  # Ceiling division
        print(f"✓ Total evaluation samples: {actual_samples}")
        print(f"✓ Total batches (batch_size={BATCH_SIZE}): {total_batches}")

        # Reset generator to ensure clean state before evaluation
        test_data.reset()
        print(f"✓ Test data generator reset for evaluation")

        print(f"[4/4] Running evaluation...")
        evaluation_status["message"] = "Evaluating model..."
        evaluation_status["progress"] = 50

        # Run evaluation
        print(f"  Calling evaluate_model()...")
        evaluation_doc = evaluate_model(
            model, test_data, evaluation_status, total_batches
        )
        print(f"✓ evaluate_model() returned successfully")

        # Save to database
        print(f"\n[FINAL] Saving results to database...")
        evaluation_status["message"] = "Saving results to database..."
        evaluation_status["progress"] = 95

        save_evaluation_to_database(evaluation_doc)
        print(f"✓ Database save completed successfully")

        # Cleanup eval dataset
        print(f"Cleaning up eval dataset...")
        if os.path.exists(eval_dataset_path):
            shutil.rmtree(eval_dataset_path)
        print(f"✓ Cleanup complete")

        evaluation_status["status"] = "completed"
        evaluation_status["message"] = "Evaluation completed successfully!"
        evaluation_status["progress"] = 100
        evaluation_status["is_evaluating"] = False

        print("=" * 80)
        print("✓ EVALUATION PROCESS COMPLETED SUCCESSFULLY")
        print("=" * 80)

    except Exception as e:
        import traceback

        print(f"\n❌ ERROR during evaluation: {e}")
        print("Full traceback:")
        traceback.print_exc()
        evaluation_status["status"] = "error"
        evaluation_status["message"] = f"Evaluation failed: {str(e)}"
        evaluation_status["is_evaluating"] = False
        raise

    finally:
        # Guarantee cleanup happens regardless of success/error
        if eval_dataset_path and os.path.exists(eval_dataset_path):
            try:
                print(f"Cleaning up eval dataset in finally block...")
                shutil.rmtree(eval_dataset_path)
                print("✓ Cleanup complete (finally block)")
            except Exception as cleanup_error:
                print(f"❌ Cleanup failed: {cleanup_error}")


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


@router.post("/admin/model/evaluate")
async def evaluate_model_endpoint(request: Request, background_tasks: BackgroundTasks):
    """Trigger model evaluation on saved model."""
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

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
    if not checkAdmin(request):
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

    return evaluation_status


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
