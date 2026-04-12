import cv2
import numpy as np


def imageQualityAnalysis(image_bytes):
    try:
        # Convert bytes to image
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return "Invalid/Blur Image"

        height, width = image.shape[:2]

        # Check Resolution (minimum 224x224 for model input)
        min_resolution = 224
        if width < min_resolution or height < min_resolution:
            return "Invalid/Blur Image"

        # Check for Blur using Laplacian Variance
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Blur threshold - if variance is too low, image is blurry
        blur_threshold = 100
        if laplacian_var < blur_threshold:
            return "Invalid/Blur Image"

        # Check brightness (too dark or too bright)
        brightness = np.mean(gray)
        if brightness < 30 or brightness > 225:
            return "Invalid/Blur Image"

        # All checks passed
        return "OK"

    except Exception as e:
        print(f"Error in imageQualityAnalysis: {e}")
        return "Invalid/Blur Image"
