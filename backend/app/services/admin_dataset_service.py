import base64
import io
import json
import os
from uuid import uuid4

from PIL import Image

# Allowed labels (same as model)
ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]
CUSTOM_DATASET_PATH = "dataset/custom"

# Only used for dataset upload and update, not for model training
def validate_and_process_image(image_data, errors: list):
    # Validate image payload and return parsed image information
    try:
        label = image_data.label
        filename = image_data.filename
        file_content = image_data.fileData

        # Check for empty filename or missing extension
        if not filename or "." not in filename:
            errors.append({"file": filename, "error": "Invalid file name"})
            return None
        
        # Check file extension
        file_ext = filename.rsplit(".", 1)[-1].lower()
        valid_extensions = ["jpg", "jpeg", "png", "gif", "webp"]
        if file_ext not in valid_extensions:
            errors.append(
                {
                    "file": filename,
                    "error": f"Invalid file extension. Allowed: {', '.join(valid_extensions)}",
                }
            )
            return None
        # Check for valid label
        if label not in ALLOWED_LABELS:
            errors.append(
                {
                    "file": filename,
                    "error": f"Invalid label: {label}. Allowed labels are: {', '.join(ALLOWED_LABELS)}",
                }
            )
            return None

        try: # Decode base64 content
            file_bytes = base64.b64decode(file_content)
        except Exception:
            errors.append(
                {"file": filename, "error": "Invalid base64 encoded file data"}
            )
            return None
        # Check file size limit - 5MB
        if len(file_bytes) > 5 * 1024 * 1024:
            errors.append({"file": filename, "error": "File size exceeds 5MB limit"})
            return None

        try:
            with Image.open(io.BytesIO(file_bytes)) as image:
                image.load()
        except Exception:
            errors.append({"file": filename, "error": "Invalid image data"})
            return None

        return {
            "file_bytes": file_bytes,
            "file_ext": file_ext,
            "label": label,
            "filename": filename,
        }

    except Exception as e:
        errors.append({"file": image_data.filename, "error": str(e)})
        return None


def parse_file_paths_json(file_path_str: str) -> list:
    # Parse file paths from string to real Python list; return empty list on failure
    try:
        return json.loads(file_path_str)
    except (ValueError, json.JSONDecodeError):
        print("Could not parse filePath JSON")
        return []


def normalize_path_for_storage(file_path: str) -> str:
    # Normalize file path to use forward slashes for cross-platform storage
    return file_path.replace("\\", "/")


def normalize_path_for_filesystem(file_path: str) -> str:
    # Convert normalized path back to OS-specific format for filesystem operations
    mixed_path = file_path.replace("/", os.sep).replace("\\", os.sep)
    return os.path.normpath(mixed_path)

# Saves image file to the custom dataset directory
def save_image_file(
    label: str, file_bytes: bytes, file_ext: str
) -> tuple[str, str, str]:
    # Save an uploaded image under the custom dataset tree and return paths
    label_folder = os.path.join(CUSTOM_DATASET_PATH, label)
    os.makedirs(label_folder, exist_ok=True)

    new_filename = f"{uuid4()}.{file_ext}"
    file_path = os.path.join(label_folder, new_filename)

    with open(file_path, "wb") as file_handle:
        file_handle.write(file_bytes)

    return file_path, new_filename, normalize_path_for_storage(file_path)


def delete_stored_file(file_path: str) -> bool:
    # Delete a stored file path if it exists
    os_specific_path = normalize_path_for_filesystem(file_path)
    if os.path.exists(os_specific_path):
        os.remove(os_specific_path)
        print(f"Deleted file: {os_specific_path}")
        return True

    print(f"File not found: {os_specific_path}")
    return False


def increment_version(current_version: str) -> str:
    # Increment semantic version string
    try:
        version = current_version.strip()
        parts = version.split(".")
        if len(parts) >= 2:
            major = int(parts[0])
            minor = int(parts[1])
            minor += 1
            if minor >= 10:
                major += 1
                minor = 0
            return f"{major}.{minor}"
    except (ValueError, IndexError):
        pass
    return f"{current_version}.1"
