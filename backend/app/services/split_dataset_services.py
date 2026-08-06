import json
import os
import random
import shutil
import tempfile
from datetime import datetime
from pathlib import Path

from app.database.collections import dataset_collection
from app.services.cloudinary_image_service import download_image_bytes

ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]


def _parse_dataset_file_paths(file_path_value: str | list) -> list[dict]:
    if isinstance(file_path_value, list):
        return [item for item in file_path_value if isinstance(item, dict)]

    if not file_path_value:
        return []

    try:
        parsed = json.loads(file_path_value)
    except (ValueError, json.JSONDecodeError):
        return []

    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]

    return []


def _collect_cloudinary_images() -> dict[str, list[dict]]:
    all_images = {label: [] for label in ALLOWED_LABELS}

    for dataset in dataset_collection.find():
        for item in _parse_dataset_file_paths(dataset.get("filePath", [])):
            label = item.get("label")
            file_url = item.get("filePath")
            if label in all_images and file_url:
                all_images[label].append(item)

    return all_images


def get_source_image_count():
    # Count all dataset images stored in MongoDB.
    total = 0
    for dataset in dataset_collection.find({}, {"imageCount": 1}):
        try:
            total += int(dataset.get("imageCount", 0))
        except Exception:
            continue
    return total


def create_split_dataset(split_path: str, train_split: float = 0.7):
    train_dir = os.path.join(split_path, "train")
    test_dir = os.path.join(split_path, "test")

    for label in ALLOWED_LABELS:
        os.makedirs(os.path.join(train_dir, label), exist_ok=True)
        os.makedirs(os.path.join(test_dir, label), exist_ok=True)

    all_images = _collect_cloudinary_images()

    for label in ALLOWED_LABELS:
        images = all_images[label]
        random.shuffle(images)
        split_index = int(len(images) * train_split)

        for image_item in images[:split_index]:
            file_bytes = download_image_bytes(image_item["filePath"])
            file_name = Path(
                image_item.get("originalFilename")
                or image_item.get("public_id")
                or "image"
            ).name
            if "." not in file_name:
                file_name = f"{file_name}.png"
            dest_path = os.path.join(train_dir, label, file_name)
            with open(dest_path, "wb") as file_handle:
                file_handle.write(file_bytes)

        for image_item in images[split_index:]:
            file_bytes = download_image_bytes(image_item["filePath"])
            file_name = Path(
                image_item.get("originalFilename")
                or image_item.get("public_id")
                or "image"
            ).name
            if "." not in file_name:
                file_name = f"{file_name}.png"
            dest_path = os.path.join(test_dir, label, file_name)
            with open(dest_path, "wb") as file_handle:
                file_handle.write(file_bytes)

    return {"train_dir": train_dir, "test_dir": test_dir}


def ensure_split_dataset(split_type: str, train_split: float = 0.7):
    if split_type == "train":
        split_path = tempfile.mkdtemp(prefix="waste_classifier_train_")
    elif split_type == "eval":
        split_path = tempfile.mkdtemp(prefix="waste_classifier_eval_")
    else:
        raise ValueError("split_type must be 'train' or 'eval'")

    train_dir = os.path.join(split_path, "train")
    test_dir = os.path.join(split_path, "test")

    print(f"Creating fresh {split_type.upper()} split in temporary directory...")
    create_split_dataset(split_path, train_split)

    metadata = {
        "created_at": datetime.now().isoformat(),
        "image_count": get_source_image_count(),
        "train_split": train_split,
    }
    metadata_file = os.path.join(split_path, ".metadata.json")
    with open(metadata_file, "w") as file_handle:
        json.dump(metadata, file_handle)

    return {"train_dir": train_dir, "test_dir": test_dir, "split_path": split_path}
