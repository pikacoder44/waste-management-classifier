import cv2
import numpy as np
from typing import Dict, Any
from app.ai.imageQualityAnalysis import ImageQualityAnalyzer
from app.ai.imageEnhancement import ImageEnhancer


class ImageProcessingService:
    # Handle image quality checking and enhancement

    # Quality thresholds
    ACCEPTABLE_QUALITY_SCORE = 70
    MINIMUM_QUALITY_SCORE = 50

    @staticmethod
    def process_and_validate(image_bytes: bytes) -> Dict[str, Any]:
        # Process and validate image quality, and enhance when needed
        try:
            # Analyze the image quality
            quality_result = ImageQualityAnalyzer.analyze(image_bytes)
            original_quality = quality_result["quality_score"]
            print(
                f"[Quality Check] Input Quality: {original_quality:.1f}% ({'valid' if quality_result['is_valid'] else 'low'})"
            )

            # If image quality is already good, return as it is
            if quality_result["is_valid"]:
                print(f"[Quality Check] Result: accepted (no enhancement)")
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

            # Check how blurry the image is
            blur_score = quality_result.get("blur_score", 100)
            # If the image is too blurry, we can't fix it
            if blur_score < 20:

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

            # If image quality is below acceptable threshold, try to improve it
            if (
                quality_result["quality_score"]
                < ImageProcessingService.ACCEPTABLE_QUALITY_SCORE
            ):
                # Try to automatically improve the image
                enhanced_image = ImageEnhancer.auto_enhance(
                    quality_result["image_array"], quality_result["issues"]
                )

                # Convert the improved image to bytes
                _, buffer = cv2.imencode(".png", enhanced_image)
                enhanced_bytes = buffer.tobytes()

                # Recheck the quality of the improved image
                enhanced_quality = ImageQualityAnalyzer.analyze(enhanced_bytes)
                print(
                    f"[Quality Check] Enhanced: {original_quality:.1f}% -> {enhanced_quality['quality_score']:.1f}% ({'valid' if enhanced_quality['is_valid'] else 'low'})"
                )

                # If the improved image is now good, use it
                if enhanced_quality["is_valid"]:
                    print(f"[Quality Check] Result: accepted after enhancement")
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

                if (
                    enhanced_quality["quality_score"]
                    >= ImageProcessingService.MINIMUM_QUALITY_SCORE
                ):
                    print(f"[Quality Check] Result: marginal quality")
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
                    print(
                        f"[Quality Check] Result: rejected (too low after enhancement)"
                    )
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

            print(f"[Quality Check] Result: rejected (too low)")
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
            print(f"[Quality Check] Error in image processing: {e}")
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
        # convert a numpy image array to bytes for saving
        try:
            _, buffer = cv2.imencode(".png", image_array)
            return buffer.tobytes()
        except Exception as e:
            print(f"Error converting image to bytes: {e}")
            raise
