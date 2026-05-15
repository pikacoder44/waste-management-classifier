import cv2
import numpy as np
from typing import Tuple


class ImageEnhancer:
    # Provide image enhancement techniques for low-quality images

    @staticmethod
    def enhance_contrast(
        image: np.ndarray, alpha: float = 1.5, beta: float = 0
    ) -> np.ndarray:
        # Enhance image contrast using brightness/contrast adjustment
        try:
            enhanced = cv2.convertScaleAbs(image, alpha=alpha, beta=beta)
            return enhanced
        except Exception as e:
            print(f"Error enhancing contrast: {e}")
            return image

    @staticmethod
    def enhance_brightness(
        image: np.ndarray, target_brightness: float = 127.5
    ) -> np.ndarray:
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            current_brightness = np.mean(gray)

            # Calculate adjustment needed
            adjustment = float(target_brightness - current_brightness)

            # Apply adjustment with bounds
            enhanced = cv2.convertScaleAbs(image, alpha=1.0, beta=adjustment)
            return enhanced
        except Exception as e:
            print(f"Error enhancing brightness: {e}")
            return image

    @staticmethod
    def denoise(image: np.ndarray) -> np.ndarray:
        try:
            # Use bilateral filter for edge-preserving denoising
            denoised = cv2.bilateralFilter(image, 9, 75, 75)
            return denoised
        except Exception as e:
            print(f"Error denoising: {e}")
            return image

    @staticmethod
    def sharpen(image: np.ndarray) -> np.ndarray:
        try:
            # Unsharp masking for sharpening
            gaussian = cv2.GaussianBlur(image, (0, 0), 2.0)
            sharpened = cv2.addWeighted(image, 1.5, gaussian, -0.5, 0)
            return np.clip(sharpened, 0, 255).astype(np.uint8)
        except Exception as e:
            print(f"Error sharpening: {e}")
            return image

    @staticmethod
    def upscale(
        image: np.ndarray, target_size: Tuple[int, int] = (448, 448)
    ) -> np.ndarray:
        try:
            height, width = image.shape[:2]

            # Only upscale if image is smaller than target
            if width < target_size[0] or height < target_size[1]:
                # Use Lanczos4 for high-quality upscaling
                upscaled = cv2.resize(
                    image, target_size, interpolation=cv2.INTER_LANCZOS4
                )
                return upscaled

            return image
        except Exception as e:
            print(f"Error upscaling: {e}")
            return image

    @staticmethod
    def enhance_for_low_blur(image: np.ndarray) -> np.ndarray:
        # Denoise -> Sharpen -> Enhance contrast
        image = ImageEnhancer.denoise(image)
        image = ImageEnhancer.sharpen(image)
        image = ImageEnhancer.enhance_contrast(image, alpha=1.2, beta=10)
        return image

    @staticmethod
    def enhance_for_low_resolution(image: np.ndarray) -> np.ndarray:
        # Upscale -> Sharpen -> Enhance contrast
        image = ImageEnhancer.upscale(image, target_size=(448, 448))
        image = ImageEnhancer.sharpen(image)
        image = ImageEnhancer.enhance_contrast(image, alpha=1.1, beta=5)
        return image

    @staticmethod
    def enhance_for_poor_lighting(image: np.ndarray) -> np.ndarray:
        # Adjust brightness -> Enhance contrast -> Denoise
        image = ImageEnhancer.enhance_brightness(image)
        image = ImageEnhancer.enhance_contrast(image, alpha=1.3, beta=15)
        image = ImageEnhancer.denoise(image)
        return image

    @staticmethod
    def auto_enhance(image: np.ndarray, issues: list) -> np.ndarray:

        if not issues:
            return image

        enhanced = image.copy()

        # Apply specific enhancements based on issues
        has_blur = any("blur" in issue.lower() for issue in issues)
        has_resolution = any("resolution" in issue.lower() for issue in issues)
        has_lighting = any(
            "dark" in issue.lower() or "bright" in issue.lower() for issue in issues
        )

        if has_blur and has_resolution:
            enhanced = ImageEnhancer.enhance_for_low_resolution(enhanced)
        elif has_blur:
            enhanced = ImageEnhancer.enhance_for_low_blur(enhanced)
        elif has_resolution:
            enhanced = ImageEnhancer.enhance_for_low_resolution(enhanced)

        if has_lighting:
            enhanced = ImageEnhancer.enhance_for_poor_lighting(enhanced)

        return enhanced
