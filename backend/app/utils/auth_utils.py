from fastapi import HTTPException, Request
from app.api.routes.auth_routes import get_user_id_from_token
from app.database.collections import user_collection
from bson import ObjectId


def verify_user_from_request(request: Request) -> str:
    # Extract and verify JWT token from request headers or cookies
    # Get token from Authorization header or cookies
    auth_header = request.headers.get("Authorization")
    jwt_token = None

    if auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header.split(" ")[1]

    if not jwt_token:
        jwt_token = request.cookies.get("access_token")

    if not jwt_token:
        raise HTTPException(status_code=401, detail="Access token not found")

    # Verify token and get user ID
    user_id = get_user_id_from_token(jwt_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid access token")

    return str(user_id)


def verify_admin_from_request(request: Request) -> dict:
    # Extract token, verify JWT, and check admin role; returns full user object
    # Get token from Authorization header or cookies
    auth_header = request.headers.get("Authorization")
    jwt_token = None

    if auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header.split(" ")[1]

    if not jwt_token:
        jwt_token = request.cookies.get("access_token")

    if not jwt_token:
        raise HTTPException(
            status_code=401, detail="Access token not found, Login first please"
        )

    # Verify token and get user ID
    user_id = get_user_id_from_token(jwt_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid access token")

    try:
        user = user_collection.find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        print(f"Database error fetching user: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")

    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403, detail="Only admin can access this resource"
        )

    return user
