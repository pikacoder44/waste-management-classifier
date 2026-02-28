# type: ignore
import os
import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(SCRIPT_DIR, "model", "waste_classifier_model.keras")

model = load_model(model_path)

test_dir = os.path.join(SCRIPT_DIR, "dataset", "test")

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

test_datagen = ImageDataGenerator(rescale=1.0 / 255)

test_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
)

print("Calculating predictions...")

predictions = model.predict(test_generator)

y_pred = np.argmax(predictions, axis=1)

y_true = test_generator.classes

class_labels = list(test_generator.class_indices.keys())

print("\n" + "=" * 30)

print("📊 FINAL EVALUATION METRICS")

print("=" * 30)

report = classification_report(
    y_true, y_pred, target_names=class_labels, output_dict=True
)

cm = confusion_matrix(y_true, y_pred)

results = {
    "accuracy": report["accuracy"],
    "precision": report["weighted avg"]["precision"],
    "recall": report["weighted avg"]["recall"],
    "f1_score": report["weighted avg"]["f1-score"],
    "confusion_matrix": cm.tolist(),
    "class_labels": class_labels,
}

frontend_utils_dir = os.path.join(SCRIPT_DIR, "..", "frontend", "utils")
os.makedirs(frontend_utils_dir, exist_ok=True)
json.dump(
    results, open(os.path.join(frontend_utils_dir, "evaluation_results.json"), "w")
)

plt.figure(figsize=(10, 8))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=class_labels,
    yticklabels=class_labels,
)

plt.title("Waste Classification: Confusion Matrix")

plt.ylabel("Actual Category")

plt.xlabel("Predicted Category")

frontend_public_dir = os.path.join(SCRIPT_DIR, "..", "frontend", "public")
os.makedirs(frontend_public_dir, exist_ok=True)
confusion_matrix_path = os.path.join(frontend_public_dir, "Confusion_Matrix.PNG")
plt.tight_layout()
plt.savefig(confusion_matrix_path, dpi=150)
plt.close()
