from pydantic import BaseModel
from typing import List, Optional


class ImageUpload(BaseModel):
    """Model for a single image upload with its label"""

    filename: str
    label: str
    fileData: str  # Base64 encoded image data


class BatchUploadRequest(BaseModel):
    """Model for batch uploading multiple images with a dataset name"""

    datasetName: str
    images: List[ImageUpload]


class UpdateDatasetRequest(BaseModel):
    dataset_id: str
    new_name: Optional[str] = None  # Optional if user only wants to add images
    description: Optional[str] = None  # Allow updating description
    version: Optional[str] = None  # Optional version update
    images: Optional[List[ImageUpload]] = None  # Optional if user only wants to rename


class DeleteDatasetRequest(BaseModel):
    dataset_id: str
