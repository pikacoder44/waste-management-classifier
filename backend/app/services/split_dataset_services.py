import os
import shutil
import random
from datetime import datetime
import json

ALLOWED_LABELS = ["cardboard", "paper", "metal", "glass", "plastic", "trash"]
BASE_DATASET_PATH = "dataset/original"
CUSTOM_DATASET_PATH = "dataset/custom"


def get_source_image_count():
    """Get total count of images from original and custom datasets."""
    total = 0
    for label in ALLOWED_LABELS:
        # Count from original
        original_path = os.path.join(BASE_DATASET_PATH, label)
        if os.path.exists(original_path):
            total += len(
                [
                    f
                    for f in os.listdir(original_path)
                    if os.path.isfile(os.path.join(original_path, f))
                ]
            )

        # Count from custom
        custom_path = os.path.join(CUSTOM_DATASET_PATH, label)
        if os.path.exists(custom_path):
            total += len(
                [
                    f
                    for f in os.listdir(custom_path)
                    if os.path.isfile(os.path.join(custom_path, f))
                ]
            )

    return total


def create_split_dataset(split_path: str, train_split: float = 0.7):

    train_dir = os.path.join(split_path, "train")
    test_dir = os.path.join(split_path, "test")

    # Create directories
    for label in ALLOWED_LABELS:
        os.makedirs(os.path.join(train_dir, label), exist_ok=True)
        os.makedirs(os.path.join(test_dir, label), exist_ok=True)

    # Merge images from both datasets
    all_images = {label: [] for label in ALLOWED_LABELS}

    # Collect from original
    for label in ALLOWED_LABELS:
        original_path = os.path.join(BASE_DATASET_PATH, label)
        if os.path.exists(original_path):
            for img_file in os.listdir(original_path):
                img_path = os.path.join(original_path, img_file)
                if os.path.isfile(img_path):
                    all_images[label].append(img_path)

    # Collect from custom
    for label in ALLOWED_LABELS:
        custom_path = os.path.join(CUSTOM_DATASET_PATH, label)
        if os.path.exists(custom_path):
            for img_file in os.listdir(custom_path):
                img_path = os.path.join(custom_path, img_file)
                if os.path.isfile(img_path):
                    all_images[label].append(img_path)

    # Split and copy
    for label in ALLOWED_LABELS:
        images = all_images[label]
        random.shuffle(images)
        split_index = int(len(images) * train_split)

        # Copy train images
        for img_path in images[:split_index]:
            dest_path = os.path.join(train_dir, label, os.path.basename(img_path))
            shutil.copy2(img_path, dest_path)

        # Copy test images
        for img_path in images[split_index:]:
            dest_path = os.path.join(test_dir, label, os.path.basename(img_path))
            shutil.copy2(img_path, dest_path)

    return {"train_dir": train_dir, "test_dir": test_dir}


def ensure_split_dataset(split_type: str, train_split: float = 0.7):

    if split_type == "train":
        split_path = "dataset/combined_temp"
    elif split_type == "eval":
        split_path = "dataset/eval_temp"
    else:
        raise ValueError("split_type must be 'train' or 'eval'")

    train_dir = os.path.join(split_path, "train")
    test_dir = os.path.join(split_path, "test")
    metadata_file = os.path.join(split_path, ".metadata.json")

    # Check if split exists and is current
    should_recreate = True

    if os.path.exists(metadata_file):
        try:
            with open(metadata_file, "r") as f:
                metadata = json.load(f)

            # Check if source data count matches
            current_count = get_source_image_count()
            if metadata.get("image_count") == current_count:
                should_recreate = False
                print(
                    f"✓ {split_type.upper()} split is current ({current_count} images)"
                )
            else:
                print(
                    f"⚠ {split_type.upper()} split outdated - current: {current_count}, cached: {metadata.get('image_count')}"
                )
        except Exception as e:
            print(f"Error reading metadata: {e}, will recreate split")

    if should_recreate:
        # Remove old split if exists
        if os.path.exists(split_path):
            print(f"Removing outdated split from {split_path}...")
            shutil.rmtree(split_path)

        print(f"Creating fresh {split_type.upper()} split...")
        create_split_dataset(split_path, train_split)

        # Save metadata
        image_count = get_source_image_count()
        os.makedirs(split_path, exist_ok=True)
        metadata = {
            "created_at": datetime.utcnow().isoformat(),
            "image_count": image_count,
            "train_split": train_split,
        }
        with open(metadata_file, "w") as f:
            json.dump(metadata, f)
        print(f"✓ {split_type.upper()} split created successfully")

    return {"train_dir": train_dir, "test_dir": test_dir, "split_path": split_path}
