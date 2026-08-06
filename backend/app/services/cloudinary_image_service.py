import io
import re
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import cloudinary.uploader


def normalize_cloudinary_folder_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "_", value.strip())
    return cleaned.strip("_") or "waste_classifier"


def upload_image_bytes(
    image_bytes: bytes,
    folder: str,
    public_id: str | None = None,
    filename: str | None = None,
) -> dict:
    image_stream = io.BytesIO(image_bytes)
    if filename:
        image_stream.name = filename

    upload_options = {
        "folder": folder,
        "resource_type": "image",
        "overwrite": False,
    }
    if public_id:
        upload_options["public_id"] = public_id
        upload_options["unique_filename"] = False
    else:
        upload_options["unique_filename"] = True

    image_stream.seek(0)
    return cloudinary.uploader.upload(image_stream, **upload_options)


def extract_public_id_from_cloudinary_url(asset_url: str | None) -> str | None:
    if not asset_url:
        return None

    parsed = urlparse(asset_url)
    if not parsed.path:
        return None

    path_parts = [part for part in parsed.path.split("/") if part]
    if "upload" not in path_parts:
        return None

    upload_index = path_parts.index("upload")
    public_parts = path_parts[upload_index + 1 :]
    if not public_parts:
        return None

    if public_parts[0].startswith("v") and public_parts[0][1:].isdigit():
        public_parts = public_parts[1:]

    if not public_parts:
        return None

    public_parts[-1] = public_parts[-1].rsplit(".", 1)[0]
    return "/".join(public_parts)


def delete_cloudinary_image(asset_reference: str | None) -> bool:
    public_id = extract_public_id_from_cloudinary_url(asset_reference)
    if not public_id and asset_reference:
        public_id = asset_reference

    if not public_id:
        return False

    result = cloudinary.uploader.destroy(
        public_id,
        resource_type="image",
        invalidate=True,
    )
    return result.get("result") in {"ok", "not found"}


def download_image_bytes(image_url: str) -> bytes:
    request = Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request) as response:
        return response.read()
