from fastapi import FastAPI
from app.database.connection import db
from app.api.routes import predict
from app.api.routes import user_routes

app = FastAPI()


@app.get("/")
def test_db():
    return {"collections": db.list_collection_names()}


app.include_router(predict.router)
app.include_router(user_routes.router)
