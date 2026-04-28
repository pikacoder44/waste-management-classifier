from fastapi import HTTPException, Request
from app.api.routes.auth_routes import get_user_id_from_token


def verify_user_from_request(request: Request) -> str:
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
