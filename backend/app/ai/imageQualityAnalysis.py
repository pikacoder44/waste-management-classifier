import cv2
import numpy as np
from typing import Dict, Any, Optional


class ImageQualityAnalyzer:
    """Analyzes image quality and provides detailed metrics."""

    # Analyzer thresholds (stricter quality validation)
    MIN_RESOLUTION = 224  # Minimum acceptable resolution
    BLUR_THRESHOLD = 100  # Stricter blur detection
    MIN_BRIGHTNESS = 30  # Minimum brightness threshold
    MAX_BRIGHTNESS = 225  # Maximum brightness threshold

    @staticmethod
    def analyze(image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze image quality and return detailed metrics.

        Args:
            image_bytes: Raw image bytes

        Returns:
            Dict with quality status and detailed metrics:
            {
                'is_valid': bool,
                'quality_score': float (0-100),
                'issues': List[str],
                'resolution': (width, height),
                'blur_score': float,
                'brightness': float,
                'image_array': Optional[np.ndarray] - decoded image if valid
            }
        """
        try:

            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                return {
                    "is_valid": False,
                    "quality_score": 0,
                    "issues": ["Failed to decode image"],
                    "resolution": None,
                    "blur_score": None,
                    "brightness": None,
                    "image_array": None,
                }

            height, width = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            brightness = np.mean(gray)

            issues = []
            quality_score = 100

            if (
                width < ImageQualityAnalyzer.MIN_RESOLUTION
                or height < ImageQualityAnalyzer.MIN_RESOLUTION
            ):
                issues.append(
                    f"Low resolution: {width}x{height} (min: {ImageQualityAnalyzer.MIN_RESOLUTION}x{ImageQualityAnalyzer.MIN_RESOLUTION})"
                )
                quality_score -= 30

            if laplacian_var < ImageQualityAnalyzer.BLUR_THRESHOLD:
                issues.append(f"Image is blurry (blur score: {laplacian_var:.2f})")
                quality_score -= 35

            if brightness < ImageQualityAnalyzer.MIN_BRIGHTNESS:
                issues.append(f"Image is too dark (brightness: {brightness:.2f})")
                quality_score -= 20
            elif brightness > ImageQualityAnalyzer.MAX_BRIGHTNESS:
                issues.append(f"Image is too bright (brightness: {brightness:.2f})")
                quality_score -= 20

            quality_score = max(0, min(100, quality_score))
            is_valid = quality_score >= 70  # Use only quality score

            return {
                "is_valid": is_valid,
                "quality_score": quality_score,
                "issues": issues,
                "resolution": (width, height),
                "blur_score": laplacian_var,
                "brightness": brightness,
                "image_array": image,
            }

        except Exception as e:
            print(f"Error in imageQualityAnalysis: {e}")
            return {
                "is_valid": False,
                "quality_score": 0,
                "issues": [f"Quality analysis error: {str(e)}"],
                "resolution": None,
                "blur_score": None,
                "brightness": None,
                "image_array": None,
            }
