from fastapi import HTTPException, Request
from app.api.routes.auth_routes import get_user_id_from_token
from app.database.collections import user_collection
from bson import ObjectId


def checkAdmin(request: Request):
    # Try to get token from Authorization header first, then fall back to cookies
    auth_header = request.headers.get("authorization")
    jwt_token = None

    if auth_header:
        # Authorization header format: "Bearer <token>"
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            jwt_token = parts[1]

    # Fall back to cookie if no Authorization header
    if not jwt_token:
        jwt_token = request.cookies.get("access_token")

    if not jwt_token:
        raise HTTPException(
            status_code=401, detail="Access token not found, Login first please"
        )

    user_id = get_user_id_from_token(jwt_token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid access token")

    # Fetch user from DB
    user = user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check role instead of hardcoded ID
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403, detail="Only admin users can access this resource"
        )

    return user  # return full user (useful later)
