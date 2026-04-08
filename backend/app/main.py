from fastapi import FastAPI
from app.database.connection import db
from app.api.routes import predict

app = FastAPI()


@app.get("/")
def test_db():
    return {"collections": db.list_collection_names()}


app.include_router(predict.router)
