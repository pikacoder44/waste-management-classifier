from fastapi import APIRouter
from app.database.collections import waste_collection

router = APIRouter()


@router.get("/test-insert")
def test_insert():
    data = {"filePath": "test.jpg", "uploadDate": "2026-04-07", "status": "pending"}

    waste_collection.insert_one(data)

    return {"message": "Inserted successfully"}
