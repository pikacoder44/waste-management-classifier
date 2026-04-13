from fastapi import HTTPException
from app.api.routes.auth_routes import get_user_id_from_token


def checkAdmin(token: str) -> bool:
    user_id = get_user_id_from_token(token)
    if user_id != "admin":
        print(f"Access denied for user_id: {user_id}. Admin access required.")
        return False
    else:
        return True
