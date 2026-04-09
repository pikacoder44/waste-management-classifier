import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Response
from jwt import encode
from typing import Optional
from app.database.collections import user_collection
from app.models.user import User
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from passlib.context import CryptContext


router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    # Create a JWT access token
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/auth/register")
def registerUser(user: User):
    # Logic-based checks
    username = user.username.lower()  # Normalize username to lowercase
    try:
        existing_user = user_collection.find_one({"username": username})
    except Exception as e:
        print(f"Database error during user lookup: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Encode the password to bytes
    password_bytes = user.password.encode("utf-8")
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)

    user_dict = {
        "username": username,
        "password": hashed_password.decode("utf-8"),  # hashed password
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
def loginUser(user: User, response: Response):
    # check if request is for admin login
    if user.role == "admin":
        try:
            existing_admin = user_collection.find_one(
                {"username": user.username, "role": "admin"}
            )
        except Exception as e:
            print(f"Database error during admin lookup: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

        if not existing_admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        if bcrypt.checkpw(
            user.password.encode("utf-8"),
            existing_admin["password"].encode("utf-8"),
        ):
            # Create JWT token
            access_token = create_access_token(
                data={
                    "sub": user.username,
                    "role": "admin",
                    "user_id": str(existing_admin["_id"]),
                }
            )
            # Set token in httponly cookie
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
            return {
                "message": "Admin login successful",
                "access_token": access_token,
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid password")
    else:
        # Normal user login
        try:
            existing_user = user_collection.find_one(
                {"username": user.username, "role": "user"}
            )
        except Exception as e:
            print(f"Database error during user lookup: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        if bcrypt.checkpw(
            user.password.encode("utf-8"), existing_user["password"].encode("utf-8")
        ):
            # Create JWT token
            access_token = create_access_token(
                data={
                    "sub": user.username,
                    "role": "user",
                    "user_id": str(existing_user["_id"]),
                }
            )
            # Set token in httponly cookie
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
            return {"message": "User login successful", "access_token": access_token}
        else:
            raise HTTPException(status_code=401, detail="Invalid password")
