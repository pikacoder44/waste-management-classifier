from fastapi import FastAPI
from app.database.connection import db

app = FastAPI()


@app.get("/")
def test_db():
    return {"collections": db.list_collection_names()}