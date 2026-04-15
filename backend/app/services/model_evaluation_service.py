import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from datetime import datetime
from typing import Dict, Any, cast
from app.database.collections import model_evaluation_collection
import os
import json

ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]


def evaluate_model(
    model, test_data, training_status: Dict[str, Any], total_batches: int | None = None
) -> Dict[str, Any]:

    print("\n" + "=" * 60)
    print("🔍 EVALUATING MODEL ON TEST DATA")
    print("=" * 60)

    # Update status if provided
    if training_status:
        training_status["message"] = "Evaluating: Generating predictions..."
        training_status["progress"] = 92

    # Get predictions
    y_true = []
    y_pred = []

    print("📊 Starting prediction loop...")
    batch_count = 0
    total_samples = 0

    for batch_num, (images, labels) in enumerate(test_data):
        # Break if we've processed all batches
        if total_batches and batch_num >= total_batches:
            print(
                f"  Reached expected {total_batches} batches, stopping prediction loop"
            )
            break

        batch_count += 1
        total_samples += images.shape[0]

        # Calculate progress based on batch number if total_batches provided
        if total_batches and training_status:
            progress = int(92 + (batch_num / total_batches) * 5)  # 92% to 97%
            progress = min(progress, 97)  # Cap at 97% during predictions
            training_status["progress"] = progress

        print(
            f"  Batch {batch_num+1}/{total_batches if total_batches else '?'}: Processing {images.shape[0]} images (total: {total_samples} samples)..."
        )

        try:
            predictions = model.predict(images, verbose=0)
            y_pred.extend([np.argmax(p) for p in predictions])
            y_true.extend([np.argmax(l) for l in labels])
            print(f"  Batch {batch_num+1}: ✓ Complete")
        except Exception as e:
            print(f"❌ ERROR in batch {batch_num+1}: {e}")
            raise

    print(
        f"✓ Prediction loop complete: {batch_count} batches, {total_samples} total samples"
    )

    # Update status - computing metrics
    if training_status:
        training_status["message"] = "Evaluating: Computing metrics..."
        training_status["progress"] = 94

    # Calculate metrics with explicit type annotation
    print(f"📈 Computing classification metrics...")
    try:
        class_report = cast(
            Dict[str, Any],
            classification_report(
                y_true, y_pred, target_names=ALLOWED_LABELS, output_dict=True
            ),
        )
        print(f"✓ Classification report computed")
        conf_matrix = confusion_matrix(y_true, y_pred)
        print(f"✓ Confusion matrix computed")
    except Exception as e:
        print(f"❌ ERROR computing metrics: {e}")
        raise

    # Extract weighted averages (safely handle dict access)
    print(f"📋 Extracting metrics...")
    weighted_metrics = class_report.get("weighted avg", {})
    weighted_precision = weighted_metrics.get("precision", 0.0)
    weighted_recall = weighted_metrics.get("recall", 0.0)
    weighted_f1 = weighted_metrics.get("f1-score", 0.0)
    accuracy = float(class_report.get("accuracy", 0.0))

    model_version = datetime.now().isoformat()
    print(f"✓ Model version: {model_version}")

    print(f"✓ Overall Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"✓ Precision (weighted): {weighted_precision:.4f}")
    print(f"✓ Recall (weighted): {weighted_recall:.4f}")
    print(f"✓ F1-Score (weighted): {weighted_f1:.4f}")

    # Update status - saving confusion matrix
    if training_status:
        training_status["message"] = "Evaluating: Saving confusion matrix..."
        training_status["progress"] = 96

    # Save confusion matrix locally
    print(f"💾 Saving confusion matrix locally...")
    try:
        save_confusion_matrix_locally(
            conf_matrix.tolist(), ALLOWED_LABELS, model_version
        )
        print(f"✓ Confusion matrix saved")
    except Exception as e:
        print(f"❌ ERROR saving confusion matrix: {e}")
        raise

    # Return evaluation document
    print(f"📦 Creating evaluation document...")
    evaluation_doc: Dict[str, Any] = {
        "modelVersion": model_version,
        "evaluationDate": datetime.now().isoformat(),
        "accuracy": accuracy,
        "precision": weighted_precision,
        "recall": weighted_recall,
        "f1_score": weighted_f1,
    }
    print(f"✓ Evaluation document created successfully")

    return evaluation_doc


def save_confusion_matrix_locally(
    conf_matrix: list, class_labels: list, model_version: str
) -> str:
    """
    Save confusion matrix to a local JSON file.

    Args:
        conf_matrix: 2D confusion matrix array
        class_labels: List of class labels
        model_version: Model version timestamp

    Returns:
        Path to the saved confusion matrix file
    """
    try:
        # Create directory if it doesn't exist
        output_dir = "evaluation_results"
        os.makedirs(output_dir, exist_ok=True)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"confusion_matrix_{timestamp}.json"
        filepath = os.path.join(output_dir, filename)

        # Create confusion matrix document
        cm_doc: Dict[str, Any] = {
            "timestamp": datetime.now().isoformat(),
            "modelVersion": model_version,
            "classLabels": class_labels,
            "confusionMatrix": conf_matrix,
        }

        # Write to file
        with open(filepath, "w") as f:
            json.dump(cm_doc, f, indent=2)

        print(f"✓ Confusion matrix saved locally to: {filepath}")
        return filepath  # Return the filepath string
    except Exception as e:
        print(f"✗ Failed to save confusion matrix locally: {e}")
        raise


def save_evaluation_to_database(evaluation_doc: Dict[str, Any]) -> str:
    """
    Save evaluation results to MongoDB.

    Args:
        evaluation_doc: Dictionary containing evaluation metrics

    Returns:
        The ID of the inserted document
    """
    try:
        # Ensure evaluation_doc is not None
        print(f"🗄️  Saving evaluation to database...")
        if not evaluation_doc or not isinstance(evaluation_doc, dict):
            print(f"❌ Invalid evaluation document: {evaluation_doc}")
            raise ValueError("Invalid evaluation document provided")

        print(f"  Document to save: {evaluation_doc}")

        # Extract only the database fields with explicit types
        db_doc: Dict[str, Any] = {
            "modelVersion": str(evaluation_doc.get("modelVersion", "")),
            "evaluationDate": str(evaluation_doc.get("evaluationDate", "")),
            "accuracy": float(evaluation_doc.get("accuracy", 0.0)),
            "precision": float(evaluation_doc.get("precision", 0.0)),
            "recall": float(evaluation_doc.get("recall", 0.0)),
            "f1_score": float(evaluation_doc.get("f1_score", 0.0)),
        }

        print(f"  Database document: {db_doc}")
        print(f"  Inserting into collection...")

        result = model_evaluation_collection.insert_one(db_doc)
        evaluation_id = str(result.inserted_id)
        print(f"✓ Evaluation saved to database (ID: {evaluation_id})")
        return evaluation_id
    except Exception as e:
        print(f"❌ Failed to save evaluation results to database: {e}")
        import traceback

        traceback.print_exc()
        raise
