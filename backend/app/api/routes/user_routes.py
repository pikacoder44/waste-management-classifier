from fastapi import APIRouter, Depends
from app.database.collections import user_collection
from app.models.user import User

router = APIRouter()


@router.post("/users")
def create_user(user: User):
    user_dict = user.dict(by_alias=True)
    user_collection.insert_one(user_dict)
    return {"message": "User created"}


@router.get("/users")
def get_users():
    users = list(user_collection.find({}, {"_id": 0}))
    return users
