from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np
import io
import json
from tensorflow.keras.models import load_model

app = FastAPI()

model = load_model("model/waste_classifier_model.keras")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load class indices from JSON file
with open("utils/class_indices.json") as f:
    class_indices = json.load(f)

class_labels = {v: k for k, v in class_indices.items()}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224))

        image_array = np.array(image).astype("float32")
        image_array = image_array / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        prediction = model.predict(image_array, verbose=0)

        class_index = int(np.argmax(prediction, axis=1)[0])
        confidence = float(np.max(prediction))

        predicted_class = class_labels[class_index]

        return {"predicted_class": predicted_class, "confidence": round(confidence, 4)}
    except Exception as e:
        return {"error": str(e)}
