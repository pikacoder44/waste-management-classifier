from PIL import Image
import numpy as np
import io

def preprocess_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224))

        image_array = np.array(image).astype("float32")
        image_array = image_array / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        return image_array
    except Exception as e:
        print(f"Error during image preprocessing: {e}")
        raise ValueError("Invalid image data")
