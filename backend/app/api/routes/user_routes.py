from fastapi import APIRouter, HTTPException
from app.database.collections import user_collection

router = APIRouter()


@router.get("/profile/{username}")
async def get_user_profile(username: str):
    # 1. Normalize and search
    normalized_name = username.lower()
    existing_user = user_collection.find_one({"username": normalized_name})

    # 2. Use HTTPException for proper status codes (404 instead of 200 with error message)
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Return the data
    return {
        "username": existing_user["username"].capitalize(),
        "role": existing_user["role"],
    }
