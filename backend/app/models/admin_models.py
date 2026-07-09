from pydantic import BaseModel
from typing import List, Optional


class ImageUpload(BaseModel):
    # Model for a single image upload with its label

    filename: str
    label: str
    fileData: str  # Base64 encoded image data


class BatchUploadRequest(BaseModel):
    # Model for batch uploading multiple images with a dataset name

    datasetName: str
    datasetDescription: Optional[str] = None
    images: List[ImageUpload]


class UpdateDatasetRequest(BaseModel):
    dataset_id: str
    new_name: Optional[str] = None  
    datasetDescription: Optional[str] = None  
    version: Optional[str] = None  
    images: Optional[List[ImageUpload]] = None  
    images_to_delete: Optional[List[str]] = None 


class DeleteDatasetRequest(BaseModel):
    dataset_id: str
