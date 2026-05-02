from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.database.connection import db
import os
from app.api.routes import auth_routes
from app.api.routes import classification_routes
from app.api.routes import admin_routes

app = FastAPI(
    title="Waste Classifier API",
    description="Secure waste classification system with JWT HTTP-only cookies",
    version="1.0.0",
)

# Only trust local hosts.
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "*.localhost",
        "localhost:8000",
        "127.0.0.1:8000",
    ],
)

# CORS has to allow credentials so auth cookies work.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|localhost\.localhost)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Requested-With",
    ],
    expose_headers=["Content-Length", "X-CSRF-Token"],
    max_age=3600,
)


@app.get("/")
def test_db():
    """Test database connection."""
    return {"collections": db.list_collection_names()}


app.include_router(auth_routes.router)
app.include_router(classification_routes.router)
app.include_router(admin_routes.router)


dataset_path = os.path.join(os.getcwd(), "dataset")
if os.path.exists(dataset_path):
    app.mount("/dataset", StaticFiles(directory=dataset_path), name="dataset")


uploads_path = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(uploads_path):
    os.makedirs(uploads_path)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")
