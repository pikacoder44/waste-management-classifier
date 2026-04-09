import bcrypt
from fastapi import APIRouter, HTTPException
from app.database.collections import user_collection
from app.models.user import User
from passlib.context import CryptContext



router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/auth/register")
def registerUser(user: User):

    # Check if user already exists
    username = user.username.lower()  # Normalize username to lowercase
    existing_user = user_collection.find_one({"username": username})
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
        "role": user.role,
    }

    result = user_collection.insert_one(user_dict)

    return {
        "message": "User registered successfully",
        "userId": str(result.inserted_id),
    }
