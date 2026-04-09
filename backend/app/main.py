from fastapi import FastAPI
from app.database.connection import db
from app.api.routes import user_routes
from app.api.routes import auth_routes

app = FastAPI()


@app.get("/")
def test_db():
    return {"collections": db.list_collection_names()}


app.include_router(user_routes.router)
app.include_router(auth_routes.router)