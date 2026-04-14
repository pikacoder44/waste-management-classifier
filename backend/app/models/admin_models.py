from pydantic import BaseModel
from typing import List


class ImageUpload(BaseModel):
    """Model for a single image upload with its label"""

    filename: str
    label: str
    fileData: str  # Base64 encoded image data


class BatchUploadRequest(BaseModel):
    """Model for batch uploading multiple images with a dataset name"""

    datasetName: str
    images: List[ImageUpload]


class DeleteDatasetRequest(BaseModel):
    dataset_id: str
