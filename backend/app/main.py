from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import db
from app.api.routes import user_routes
from app.api.routes import auth_routes
from app.api.routes import classification_routes
from app.api.routes import admin_routes

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def test_db():
    return {"collections": db.list_collection_names()}


app.include_router(user_routes.router)
app.include_router(auth_routes.router)
app.include_router(classification_routes.router)
app.include_router(admin_routes.router)
