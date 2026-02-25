from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
import numpy as np
import io
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

app = FastAPI()

model = load_model("model/waste_classifier_model.keras")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))

    image_array = np.array(image).astype("float32")
    image_array = preprocess_input(image_array)
    image_array = np.expand_dims(image_array, axis=0)

    prediction = model.predict(image_array)

    class_index = np.argmax(prediction)
    confidence = float(np.max(prediction))

    class_labels = ["Cardboard", "Glass", "Metal", "Paper", "Plastic", "Trash"]

    predicted_class = class_labels[class_index]

    return {"predicted_class": predicted_class, "confidence": round(confidence, 4)}

