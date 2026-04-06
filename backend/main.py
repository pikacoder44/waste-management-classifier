from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import io
import json
from keras.models import load_model

app = FastAPI()

model = load_model("model/waste_classifier_model.keras")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("utils/class_indices.json") as f:
    class_indices = json.load(f)

class_labels = {v: k for k, v in class_indices.items()}

# Disposal recommendations for each waste category
disposal_recommendations = {
    "cardboard": {
        "disposal_method": "Recycle Bin",
        "instructions": "Flatten the cardboard box and place in the recycling bin.",
    },
    "paper": {
        "disposal_method": "Recycle Bin",
        "instructions": "Place clean, dry paper in the recycling bin.",
    },
    "metal": {
        "disposal_method": "Recycle Bin",
        "instructions": "Rinse metal items and place in the recycling bin.",
    },
    "glass": {
        "disposal_method": "Recycle Bin (Separate if available)",
        "instructions": "Place glass items in the recycling bin or separate glass collection.",
    },
    "plastic": {
        "disposal_method": "Recycle Bin",
        "instructions": "Rinse plastic items and check the recycling symbol on the bottom.",
    },
    "trash": {
        "disposal_method": "General Waste / Landfill",
        "instructions": "Place in the regular trash bin for disposal at landfill.",
    },
}


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

        # Get disposal recommendations
        recommendations = disposal_recommendations.get(
            predicted_class.lower(),
            {
                "disposal_method": "Unknown",
                "instructions": "Please check local waste management guidelines.",
                "tips": "",
            },
        )

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "disposal_method": recommendations["disposal_method"],
            "disposal_instructions": recommendations["instructions"],
        }
    except Exception as e:
        return {"error": str(e)}
