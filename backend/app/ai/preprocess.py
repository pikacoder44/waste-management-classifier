from PIL import Image
import numpy as np
import io


def preprocess_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Check if image is too small/blurry to be useful
        if image.width < 100 or image.height < 100:
            raise ValueError("Image too small (minimum 100×100 pixels required)")

        # Preserve aspect ratio: resize to fit within 224x224
        target_size = 224
        image.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)

        # Center crop/pad: create 224x224 black background
        final_image = Image.new("RGB", (target_size, target_size), (0, 0, 0))

        # Calculate offset to center the image
        offset_x = (target_size - image.width) // 2
        offset_y = (target_size - image.height) // 2

        # Paste resized image onto center of black background
        final_image.paste(image, (offset_x, offset_y))
        image = final_image

        image_array = np.array(image).astype("float32")
        image_array = image_array / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        return image_array
    except Exception as e:
        print(f"Error during image preprocessing: {e}")
        raise ValueError("Invalid image data")
