from bson import ObjectId
from datetime import datetime
from typing import Any, Dict


def sanitize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert ObjectId and datetime in a MongoDB document to JSON-serializable types.

    - ObjectId -> str
    - datetime -> ISO 8601 string
    Works recursively for nested dicts and lists.
    """

    def _convert(value: Any) -> Any:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {k: _convert(v) for k, v in value.items()}
        if isinstance(value, list):
            return [_convert(v) for v in value]
        return value

    return {k: _convert(v) for k, v in doc.items()}
