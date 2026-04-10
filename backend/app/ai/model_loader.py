from keras.models import load_model
from pathlib import Path

current_file = Path(__file__).resolve()
project_root = current_file.parent.parent.parent
MODEL_PATH = project_root / "model" / "waste_classifier_model.keras"
try:
    print(f"Loading model from: {MODEL_PATH}")
    model = load_model(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    raise Exception(f"Failed to load model: {e}")
