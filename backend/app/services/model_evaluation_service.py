import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from datetime import datetime
from typing import Dict, Any, cast
from app.database.collections import model_evaluation_collection
import os
import json

ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]


def evaluate_model(model, test_data) -> Dict[str, Any]:

    print("\n" + "=" * 60)
    print("🔍 EVALUATING MODEL ON TEST DATA")
    print("=" * 60)

    # Get predictions
    y_true = []
    y_pred = []

    for images, labels in test_data:
        predictions = model.predict(images, verbose=0)
        y_pred.extend([np.argmax(p) for p in predictions])
        y_true.extend([np.argmax(l) for l in labels])

    # Calculate metrics with explicit type annotation
    class_report = cast(
        Dict[str, Any],
        classification_report(
            y_true, y_pred, target_names=ALLOWED_LABELS, output_dict=True
        ),
    )
    conf_matrix = confusion_matrix(y_true, y_pred)

    # Extract weighted averages (safely handle dict access)
    weighted_metrics = class_report.get("weighted avg", {})
    weighted_precision = weighted_metrics.get("precision", 0.0)
    weighted_recall = weighted_metrics.get("recall", 0.0)
    weighted_f1 = weighted_metrics.get("f1-score", 0.0)
    accuracy = float(class_report.get("accuracy", 0.0))

    model_version = datetime.now().isoformat()

    print(f"✓ Overall Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"✓ Precision (weighted): {weighted_precision:.4f}")
    print(f"✓ Recall (weighted): {weighted_recall:.4f}")
    print(f"✓ F1-Score (weighted): {weighted_f1:.4f}")

    # Save confusion matrix locally
    save_confusion_matrix_locally(conf_matrix.tolist(), ALLOWED_LABELS, model_version)

    # Return evaluation document
    evaluation_doc: Dict[str, Any] = {
        "modelVersion": model_version,
        "evaluationDate": datetime.now().isoformat(),
        "accuracy": accuracy,
        "precision": weighted_precision,
        "recall": weighted_recall,
        "f1_score": weighted_f1,
    }

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
        # Extract only the database fields with explicit types
        db_doc: Dict[str, Any] = {
            "modelVersion": str(evaluation_doc["modelVersion"]),
            "evaluationDate": str(evaluation_doc["evaluationDate"]),
            "accuracy": float(evaluation_doc["accuracy"]),
            "precision": float(evaluation_doc["precision"]),
            "recall": float(evaluation_doc["recall"]),
            "f1_score": float(evaluation_doc["f1_score"]),
        }

        result = model_evaluation_collection.insert_one(db_doc)
        evaluation_id = str(result.inserted_id)
        print(f"✓ Evaluation saved to database (ID: {evaluation_id})")
        return evaluation_id
    except Exception as e:
        print(f"✗ Failed to save evaluation results to database: {e}")
        raise
