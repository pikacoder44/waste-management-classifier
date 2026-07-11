# type: ignore
import os
import shutil
from datetime import datetime

from app.database.collections import dataset_collection
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from app.services.model_evaluation_service import (
    evaluate_model,
    save_evaluation_to_database,
)
from app.services.split_dataset_services import ensure_split_dataset

TRAINING_EPOCHS = 20

training_status = {
    "is_training": False,
    "progress": 0,
    "status": "idle",
    "message": "No training in progress",
    "started_at": None,
    "epoch": 0,
    "total_epochs": TRAINING_EPOCHS,
}

evaluation_status = {
    "is_evaluating": False,
    "progress": 0,
    "status": "idle",
    "message": "No evaluation in progress",
    "started_at": None,
}


def run_training_logic():
    # Merge datasets, train model, and save artifacts while updating status
    global training_status

    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    EPOCHS = TRAINING_EPOCHS
    TRAIN_SPLIT = 0.7

    # Updating status to indicate training has started
    training_status["is_training"] = True
    training_status["status"] = "preparing_data"
    training_status["message"] = "Preparing dataset..."
    training_status["started_at"] = datetime.now().isoformat()
    training_status["progress"] = 5

    combined_dataset_path = ""

    try:
        print("Checking if train split exists and is current...")
        split_info = ensure_split_dataset("train", TRAIN_SPLIT)
        train_dir = split_info["train_dir"]
        test_dir = split_info["test_dir"]
        combined_dataset_path = split_info["split_path"]

        # Updating status
        training_status["message"] = "Loading data into memory..."
        training_status["progress"] = 25

        train_datagen = ImageDataGenerator(
            preprocessing_function=preprocess_input,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode="nearest",
        )
        test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

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
            shuffle=False,  # because we want consistent evaluation results
        )

        # Updating status
        training_status["message"] = "Building model..."
        training_status["progress"] = 40

        base_model = MobileNetV2(
            weights="imagenet", include_top=False, input_shape=(224, 224, 3)
        )
        base_model.trainable = False  # freeze base layers for transfer learning

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

        # Updating status
        training_status["status"] = "training"
        training_status["message"] = "Training model..."
        training_status["total_epochs"] = EPOCHS
        training_status["epoch"] = 0
        training_status["progress"] = 50

        early_stopping = keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=5, restore_best_weights=True
        )

        # Custom callback to update training status after each epoch
        class StatusCallback(keras.callbacks.Callback):
            def on_epoch_end(self, epoch, logs=None):
                # After every epoch, update the training status
                training_status["epoch"] = epoch + 1
                progress = 50 + (epoch + 1) / EPOCHS * 40
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

        # Updating status
        training_status["message"] = "Saving model..."
        training_status["progress"] = 95

        # Saving the model in a directory named 'model'
        model_path = os.path.join("model", "waste_classifier_model.keras")
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        model.save(model_path)

        # Updating status
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
        if combined_dataset_path and os.path.exists(combined_dataset_path):
            print("\nCleaning up temporary combined dataset...")
            shutil.rmtree(combined_dataset_path)


def run_evaluation_logic():
    # Run evaluation against the holdout split and persist evaluation results
    global evaluation_status

    # Initializing evaluation status
    evaluation_status["is_evaluating"] = True
    evaluation_status["status"] = "running"
    evaluation_status["message"] = "Loading model..."
    evaluation_status["started_at"] = datetime.now().isoformat()
    evaluation_status["progress"] = 10

    eval_dataset_path = None

    try:
        IMG_SIZE = (224, 224)
        BATCH_SIZE = 32
        TRAIN_SPLIT = 0.7

         # Fetch the latest dataset ID from the database
        latest_dataset = dataset_collection.find_one(sort=[("uploadDate", -1)])
        dataset_id = latest_dataset["_id"] if latest_dataset else None

        model_path = os.path.join("model", "waste_classifier_model.keras")
        if not os.path.exists(model_path):
            evaluation_status["status"] = "error"
            evaluation_status["message"] = (
                "Model not found. Please train the model first."
            )
            evaluation_status["is_evaluating"] = False
            evaluation_status["progress"] = 0
            return

        model = keras.models.load_model(model_path)
        evaluation_status["message"] = "Checking evaluation dataset..."
        evaluation_status["progress"] = 30

        split_info = ensure_split_dataset("eval", train_split=TRAIN_SPLIT)
        eval_test_dir = split_info["test_dir"]
        eval_dataset_path = split_info["split_path"]

        test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
        test_data = test_datagen.flow_from_directory(
            eval_test_dir,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode="categorical",
            shuffle=False,
        )

        # Calculate total batches for progress tracking
        actual_samples = test_data.samples
        total_batches = (actual_samples + BATCH_SIZE - 1) // BATCH_SIZE

        test_data.reset()

        # Updating status
        evaluation_status["message"] = "Evaluating model..."
        evaluation_status["progress"] = 50

        evaluation_doc = evaluate_model(
            model, test_data, evaluation_status, dataset_id, total_batches
        )

        # Updating status
        evaluation_status["message"] = "Saving results to database..."
        evaluation_status["progress"] = 95

        save_evaluation_to_database(evaluation_doc)

        if os.path.exists(eval_dataset_path):
            shutil.rmtree(eval_dataset_path)
            
        # Updating status
        evaluation_status["status"] = "completed"
        evaluation_status["message"] = "Evaluation completed successfully!"
        evaluation_status["progress"] = 100
        evaluation_status["is_evaluating"] = False

    except Exception as e:
        import traceback

        print(f"Error during evaluation: {e}")
        traceback.print_exc()
        evaluation_status["status"] = "error"
        evaluation_status["message"] = f"Evaluation failed: {str(e)}"
        evaluation_status["is_evaluating"] = False
        raise

    finally:
        if eval_dataset_path and os.path.exists(eval_dataset_path):
            try:
                shutil.rmtree(eval_dataset_path)
            except Exception as cleanup_error:
                print(f"Cleanup failed: {cleanup_error}")
