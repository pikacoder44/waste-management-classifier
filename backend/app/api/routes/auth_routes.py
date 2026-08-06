import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from jwt import encode, decode
from typing import Optional, Any
from app.database.collections import user_collection
from app.models.user import User
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # Create a JWT access token
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_id_from_token(token: str) -> Optional[str]:
    # Extract and validate user_id from JWT token
    try:
        payload: dict[str, Any] = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        return user_id if isinstance(user_id, str) else None
    except Exception as e:
        print(f"Error decoding JWT token: {e}")
        return None


def _login_user_helper(username: str, password: str, role: str):
    # Handle login logic for both admin and user roles
    # Check if username is empty
    if not username or not username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    # Check if password is empty
    if not password:
        raise HTTPException(status_code=400, detail="Password cannot be empty")
    # Check if role is valid (only admin or user)
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Convert username to lowercase for consistency
    username = username.lower().strip()
    # Look up user in the database
    try:
        existing_user = user_collection.find_one({"username": username, "role": role})
    except Exception as e:
        print(f"Database error during {role} lookup: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # Check if user was found
    if not existing_user:
        raise HTTPException(status_code=404, detail=f"{role.capitalize()} not found")

    # Check if the password matches the one stored in database
    if not bcrypt.checkpw(
        password.encode("utf-8"), existing_user["password"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid password")

    access_token = create_access_token(
        data={
            "sub": username,
            "role": role,
            "user_id": str(existing_user["_id"]),
        }
    )

    return {
        "access_token": access_token,
        "message": f"{role.capitalize()} login successful",
    }


@router.post("/auth/register")
def registerUser(user: User):
    # Check if username is empty
    if not user.username or not user.username.strip():
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    # Check if password is at least 8 characters
    if not user.password or len(user.password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters long"
        )

    # Convert username to lowercase for consistency
    username = user.username.lower().strip()
    # Check if user already exists in database
    try:
        existing_user = user_collection.find_one({"username": username})
    except Exception as e:
        print(f"Database error during user lookup: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    # If user exists, stop and return error
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")
    # Hash the password before saving
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), salt)

    # Build user document using model structure, but with hashed password
    user_dict = user.model_dump()
    user_dict["username"] = username
    user_dict["password"] = hashed_password.decode("utf-8")
    user_dict["role"] = "user"  # Always register as regular user

    # Save user to database
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
    if not user.role:
        raise HTTPException(status_code=400, detail="Role is required")

    login_result = _login_user_helper(user.username, user.password, user.role)

    expiry_time = int(
        (datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()
    )

    response_obj = JSONResponse(
        {
            "message": login_result["message"],
            "expiresAt": expiry_time,
        }
    )
    response_obj.set_cookie(
        key="access_token",
        value=login_result["access_token"],
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return response_obj


@router.post("/auth/logout")
def logoutUser():
    response_obj = JSONResponse({"message": "Logout successful"})
    response_obj.delete_cookie(
        key="access_token", httponly=True, secure=True, samesite="none", path="/"
    )
    return response_obj
