import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import JSONResponse
from jwt import encode, decode
from typing import Optional, Any
from app.database.collections import user_collection
from app.models.user import User
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES


router = APIRouter()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_id_from_token(token: str) -> Optional[str]:
    """Extract and validate user_id from JWT token."""
    try:
        payload: dict[str, Any] = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        return user_id if isinstance(user_id, str) else None
    except Exception as e:
        print(f"Error decoding JWT token: {e}")
        return None


def _login_user_helper(username: str, password: str, role: str):
    """Helper function to handle login logic for both admin and user roles."""
    # Validate input
    if not username or not username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if not password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    username = username.lower().strip()
    try:
        existing_user = user_collection.find_one({"username": username, "role": role})
    except Exception as e:
        print(f"Database error during {role} lookup: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if not existing_user:
        raise HTTPException(status_code=404, detail=f"{role.capitalize()} not found")

    # Verify password
    if not bcrypt.checkpw(
        password.encode("utf-8"), existing_user["password"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Create JWT token
    access_token = create_access_token(
        data={
            "sub": username,
            "role": role,
            "user_id": str(existing_user["_id"]),
        }
    )

    # Return token and user info
    return {
        "access_token": access_token,
        "message": f"{role.capitalize()} login successful",
    }


@router.post("/auth/register")
def registerUser(user: User):
    # Validate input
    if not user.username or not user.username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if not user.password or len(user.password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters long"
        )

    # Logic-based checks
    username = user.username.lower().strip()  # Normalize username to lowercase
    try:
        existing_user = user_collection.find_one({"username": username})
    except Exception as e:
        print(f"Database error during user lookup: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")
    # Hash password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), salt)

    user_dict = {
        "username": username,
        "password": hashed_password.decode("utf-8"),  # Store as string
        "role": "user",  # Force role to 'user' for all registered users
    }

    # Only wrap the unpredictable DB operation
    try:
        result = user_collection.insert_one(user_dict)
    except Exception as e:
        print(f"Database error during user creation: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    return {
        "message": "User registered successfully",
        "userId": str(result.inserted_id),
    }


@router.post("/auth/login")
def loginUser(user: User):
    # Validate role is provided
    if not user.role:
        raise HTTPException(status_code=400, detail="Role is required")

    # Use helper function for login logic
    login_result = _login_user_helper(user.username, user.password, user.role)

    # Set token as HTTP-only cookie on response
    response_obj = JSONResponse({"message": login_result["message"]})
    response_obj.set_cookie(
        key="access_token",
        value=login_result["access_token"],
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return response_obj


@router.post("/auth/logout")
def logoutUser():
    # Clear the access token cookie
    response_obj = JSONResponse({"message": "Logout successful"})
    response_obj.delete_cookie(key="access_token")
    return response_obj
