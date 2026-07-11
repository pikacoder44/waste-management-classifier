import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from datetime import datetime
from typing import Dict, Any, cast
from bson import ObjectId
import matplotlib

# Use a headless backend so evaluation can render plots safely in background threads.
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pathlib import Path

from app.database.collections import model_evaluation_collection
from app.models.model_evaluation import ModelEvaluation

ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]
BACKEND_ROOT = Path(__file__).resolve().parents[2]


def evaluate_model(
    model,
    test_data,
    training_status: Dict[str, Any],
    dataset_id: ObjectId | None,
    total_batches: int | None = None,
) -> Dict[str, Any]:
    print("\nStarting model evaluation...")

    if training_status:
        training_status["message"] = "Generating predictions..."
        training_status["progress"] = 92

    y_true = [] # Actual labels
    y_pred = [] # Predicted labels
    batch_count = 0
    total_samples = 0

    try:
        for batch_num, (images, labels) in enumerate(test_data):
            if total_batches and batch_num >= total_batches:
                print(
                    f"  Reached expected {total_batches} batches, stopping prediction loop"
                )
                break

            batch_count += 1
            total_samples += images.shape[0]

            if total_batches and training_status:
                progress = int(92 + (batch_num / total_batches) * 5)
                progress = min(progress, 97)
                training_status["progress"] = progress

            print(
                f"  Batch {batch_num+1}/{total_batches if total_batches else '?'}: Processing {images.shape[0]} images (total: {total_samples} samples)..."
            )

            predictions = model.predict(images, verbose=0)
            if predictions is None or len(predictions) == 0:
                raise ValueError(
                    f"Model returned empty predictions for batch {batch_num+1}"
                )

            y_pred.extend([np.argmax(p) for p in predictions])
            y_true.extend([np.argmax(l) for l in labels])
            print(f"  Batch {batch_num+1}: Complete")

    except Exception as loop_error:
        print(f"Error in prediction loop: {loop_error}")
        import traceback

        traceback.print_exc()
        raise

    print(
        f"Prediction loop complete: {batch_count} batches, {total_samples} total samples"
    )

    if training_status:
        training_status["message"] = "Evaluating: Computing metrics..."
        training_status["progress"] = 94

    print("-- Computing classification metrics...")

    # Validate that we have predictions and labels
    if not y_true or not y_pred:
        raise ValueError(
            f"No predictions or labels collected. y_true: {len(y_true)}, y_pred: {len(y_pred)}"
        )
    
    # Validate that the lengths of predictions and labels match
    if len(y_true) != len(y_pred):
        raise ValueError(
            f"Mismatch in predictions and labels length. y_true: {len(y_true)}, y_pred: {len(y_pred)}"
        )
    
    # Generate classification report and confusion matrix
    try:
        class_report = cast(
            Dict[str, Any],
            classification_report(
                y_true, y_pred, target_names=ALLOWED_LABELS, output_dict=True
            ),
        )
        print("\t Classification report computed")
        conf_matrix = confusion_matrix(y_true, y_pred)
        print("\t Confusion matrix computed")
    except Exception as e:
        print(f"Error computing metrics: {e}")
        import traceback

        traceback.print_exc()
        raise

    print("-- Extracting metrics...")
    # Calculate weighted metrics from classification report
    weighted_metrics = class_report.get("weighted avg", {})
    weighted_precision = weighted_metrics.get("precision", 0.0)
    weighted_recall = weighted_metrics.get("recall", 0.0)
    weighted_f1 = weighted_metrics.get("f1-score", 0.0)
    accuracy = float(class_report.get("accuracy", 0.0))
    model_version = datetime.now().isoformat()

    # Print metrics for logging
    print(f"\tModel version: {model_version}")
    print(f"\tOverall Accuracy: {accuracy:.4f}")
    print(f"\tPrecision (weighted): {weighted_precision:.4f}")
    print(f"\tRecall (weighted): {weighted_recall:.4f}")
    print(f"\tF1-Score (weighted): {weighted_f1:.4f}")

    if training_status:
        training_status["message"] = "Evaluating: Saving confusion matrix..."
        training_status["progress"] = 96

    # Generate and save confusion matrix image
    try:
        generate_confusion_matrix_image(conf_matrix, ALLOWED_LABELS)
        print("\tConfusion matrix PNG saved")
    except Exception as e:
        print(f"\tError generating confusion matrix image: {e}")
        raise

    print("-- Creating evaluation document...")
    evaluation_doc: Dict[str, Any] = {
        "modelVersion": model_version,
        "datasetId": dataset_id,
        "evaluationDate": datetime.now(),
        "accuracy": accuracy,
        "precision": weighted_precision,
        "recall": weighted_recall,
        "f1_score": weighted_f1,
    }
    print("\tEvaluation document created")

    return evaluation_doc


def generate_confusion_matrix_image(conf_matrix: np.ndarray, class_labels: list) -> str:
    # Generate and save confusion matrix image to backend/evaluation_results
    try:
        # Create backend directory
        output_dir = BACKEND_ROOT / "evaluation_results"
        output_dir.mkdir(parents=True, exist_ok=True)

        output_path = output_dir / "confusionMatrix.png"

        print(f"-- Generating confusion matrix visualization...")

        # Create a blank graph
        plt.figure(figsize=(10, 8))

        # Display confusion matrix as an image
        im = plt.imshow(conf_matrix, interpolation="nearest", cmap="Blues")

        # Add color scale bar to the side of the confusion matrix
        cbar = plt.colorbar(im, ax=plt.gca())
        cbar.set_label("Number of Predictions", rotation=270, labelpad=20)

        # Set labels and title
        plt.title(
            "Confusion Matrix - Waste Classification Model",
            fontsize=14,
            fontweight="bold",
            pad=20,
        )
        plt.xlabel("Predicted Label", fontsize=12)
        plt.ylabel("True Label", fontsize=12)

        # Set tick labels
        tick_marks = np.arange(len(class_labels))
        plt.xticks(tick_marks, class_labels, rotation=45, ha="right")
        plt.yticks(tick_marks, class_labels, rotation=0)

        # Add text annotations showing the counts
        threshold = conf_matrix.max() / 2.0
        for i in range(conf_matrix.shape[0]):
            for j in range(conf_matrix.shape[1]):
                count = conf_matrix[i, j]
                # Use white text for dark blue bg and black text for light blue bg
                color = "white" if count > threshold else "black"
                plt.text(
                    j,
                    i,
                    f"{int(count)}",
                    horizontalalignment="center",
                    verticalalignment="center",
                    color=color,
                    fontsize=11,
                    fontweight="bold",
                )

        plt.tight_layout()

        # Save to backend directory (overwrites previous file automatically)
        plt.savefig(output_path, dpi=100, bbox_inches="tight")
        plt.close()
        return str(output_path)

    except Exception as e:
        print(f"Failed to generate confusion matrix image: {e}")
        import traceback

        traceback.print_exc()
        raise


def save_evaluation_to_database(evaluation_doc: Dict[str, Any]) -> str:
    evaluation_id: str = ""
    try:
        # Ensure evaluation_doc is not None
        print(f"Saving evaluation to database...")
        if not evaluation_doc or not isinstance(evaluation_doc, dict):
            print(f"Invalid evaluation document: {evaluation_doc}")
            raise ValueError("Invalid evaluation document provided")

        model_evaluation = ModelEvaluation(**evaluation_doc)
        db_doc = model_evaluation.model_dump()

        print("\tInserting into collection...")

        result = model_evaluation_collection.insert_one(db_doc)
        evaluation_id = str(result.inserted_id)
        print(f"Evaluation saved to database successfully")
    except Exception as e:
        print(f"Failed to save evaluation results to database: {e}")
        import traceback

        traceback.print_exc()
        raise

    return evaluation_id
