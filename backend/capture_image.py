import cv2


def capture_image() -> bytes:
    """
    Capture a single frame from the default webcam and return it as JPEG bytes.

    This is intended to be called from the FastAPI backend so the
    captured image can be sent to the frontend.
    """
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        cap.release()
        raise RuntimeError("Could not open webcam")

    success, frame = cap.read()
    cap.release()

    if not success or frame is None:
        raise RuntimeError("Failed to capture image from webcam")

    # Encode the frame as JPEG so it can be sent over HTTP
    encoded, buffer = cv2.imencode(".jpg", frame)
    if not encoded:
        raise RuntimeError("Failed to encode image as JPEG")

    return buffer.tobytes()