import cv2
import numpy as np
from typing import Dict, Any
from app.ai.imageQualityAnalysis import ImageQualityAnalyzer
from app.ai.imageEnhancement import ImageEnhancer


class ImageProcessingService:
    """
    Orchestrates image quality checking, enhancement, and re-validation.
    Implements auto-reprocessing for low-quality images.
    """

    # Quality thresholds
    ACCEPTABLE_QUALITY_SCORE = 70  # 70+ is acceptable
    MINIMUM_QUALITY_SCORE = 50  # Below 50 is unusable even after enhancement

    @staticmethod
    def process_and_validate(image_bytes: bytes) -> Dict[str, Any]:
        """
        Main pipeline: Check quality -> Enhance if needed -> Re-validate -> Return result.

        Args:
            image_bytes: Raw image bytes

        Returns:
            {
                'status': 'success' | 'warning' | 'error',
                'is_valid': bool,
                'quality_score': float,
                'original_quality': float,
                'was_enhanced': bool,
                'issues': List[str],
                'warnings': List[str],
                'image_array': Optional[np.ndarray],
                'message': str
            }
        """
        try:
            # Step 1: Analyze original image quality
            quality_result = ImageQualityAnalyzer.analyze(image_bytes)
            original_quality = quality_result["quality_score"]
            print(
                f"[Quality Check] Original quality: {original_quality:.1f}%, Valid: {quality_result['is_valid']}, Issues: {quality_result['issues']}"
            )

            # If image is valid, return immediately
            if quality_result["is_valid"]:
                print(
                    f"[Quality Check] ✓ Image quality acceptable, no enhancement needed"
                )
                return {
                    "status": "success",
                    "is_valid": True,
                    "quality_score": quality_result["quality_score"],
                    "original_quality": original_quality,
                    "was_enhanced": False,
                    "issues": quality_result["issues"],
                    "warnings": [],
                    "image_array": quality_result["image_array"],
                    "message": "Image quality is acceptable",
                }

            # Check for extreme blur - if blur score is very low, it's not fixable
            blur_score = quality_result.get("blur_score", 100)
            if blur_score < 30:
                print(
                    f"[Quality Check] ✗ Image blur is extreme (blur score: {blur_score:.2f}), cannot be enhanced"
                )
                return {
                    "status": "error",
                    "is_valid": False,
                    "quality_score": original_quality,
                    "original_quality": original_quality,
                    "was_enhanced": False,
                    "issues": quality_result["issues"],
                    "warnings": [],
                    "image_array": None,
                    "message": "Image is too blurry to enhance. Please retake the photo with better focus and lighting.",
                }

            # Step 2: If image quality is too low, try enhancement
            if (
                quality_result["quality_score"]
                < ImageProcessingService.ACCEPTABLE_QUALITY_SCORE
            ):
                print(f"[Quality Check] Attempting to enhance image...")
                enhanced_image = ImageEnhancer.auto_enhance(
                    quality_result["image_array"], quality_result["issues"]
                )

                # Step 3: Convert enhanced image back to bytes and re-analyze
                _, buffer = cv2.imencode(".png", enhanced_image)
                enhanced_bytes = buffer.tobytes()

                enhanced_quality = ImageQualityAnalyzer.analyze(enhanced_bytes)
                print(
                    f"[Quality Check] Enhanced quality: {enhanced_quality['quality_score']:.1f}%, Valid: {enhanced_quality['is_valid']}"
                )

                # Step 4: Check if enhancement helped
                if enhanced_quality["is_valid"]:
                    print(f"[Quality Check] ✓ Enhancement successful, image now valid")
                    return {
                        "status": "warning",
                        "is_valid": True,
                        "quality_score": enhanced_quality["quality_score"],
                        "original_quality": original_quality,
                        "was_enhanced": True,
                        "issues": quality_result["issues"],
                        "warnings": ["Image was auto-enhanced due to low quality"],
                        "image_array": enhanced_quality["image_array"],
                        "message": f'Image enhanced successfully (original: {original_quality:.1f}%, enhanced: {enhanced_quality["quality_score"]:.1f}%)',
                    }

                # If enhancement didn't help enough
                if (
                    enhanced_quality["quality_score"]
                    >= ImageProcessingService.MINIMUM_QUALITY_SCORE
                ):
                    print(f"[Quality Check] ⚠ Enhancement improved but still marginal")
                    return {
                        "status": "warning",
                        "is_valid": True,
                        "quality_score": enhanced_quality["quality_score"],
                        "original_quality": original_quality,
                        "was_enhanced": True,
                        "issues": quality_result["issues"],
                        "warnings": [
                            f'Image quality is marginal ({enhanced_quality["quality_score"]:.1f}%)',
                            "Classification may be less accurate",
                        ],
                        "image_array": enhanced_quality["image_array"],
                        "message": "Image was enhanced but quality remains low. Results may be less accurate.",
                    }
                else:
                    print(f"[Quality Check] ✗ Enhancement failed, quality too low")
                    return {
                        "status": "error",
                        "is_valid": False,
                        "quality_score": enhanced_quality["quality_score"],
                        "original_quality": original_quality,
                        "was_enhanced": True,
                        "issues": quality_result["issues"] + enhanced_quality["issues"],
                        "warnings": [],
                        "image_array": None,
                        "message": f"Image quality too low even after enhancement. Please retake the image with better lighting and focus.",
                    }

            # Original quality is between acceptable and minimum
            print(
                f"[Quality Check] ✗ Image quality insufficient, no enhancement attempted"
            )
            return {
                "status": "error",
                "is_valid": False,
                "quality_score": quality_result["quality_score"],
                "original_quality": original_quality,
                "was_enhanced": False,
                "issues": quality_result["issues"],
                "warnings": [],
                "image_array": None,
                "message": f'Image quality is insufficient ({quality_result["quality_score"]:.1f}%). Issues: {", ".join(quality_result["issues"])}',
            }

        except Exception as e:
            print(f"[Quality Check] ✗ Error in image processing service: {e}")
            return {
                "status": "error",
                "is_valid": False,
                "quality_score": 0,
                "original_quality": 0,
                "was_enhanced": False,
                "issues": [str(e)],
                "warnings": [],
                "image_array": None,
                "message": f"Error processing image: {str(e)}",
            }

    @staticmethod
    def convert_to_bytes(image_array: np.ndarray) -> bytes:
        """
        Convert image array back to bytes for preprocessing.

        Args:
            image_array: Image as numpy array (BGR)

        Returns:
            Image bytes (PNG format)
        """
        try:
            _, buffer = cv2.imencode(".png", image_array)
            return buffer.tobytes()
        except Exception as e:
            print(f"Error converting image to bytes: {e}")
            raise
