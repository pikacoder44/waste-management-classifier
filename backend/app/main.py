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

# Trust only specific hosts to prevent HTTP Host header attacks
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

# Configure CORS - IMPORTANT for HTTP-only cookies
# Cookies are only sent if credentials: 'include' is used in fetch AND CORS allows it
app.add_middleware(
    CORSMiddleware,
    # Allow all localhost origins for development
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|localhost\.localhost)(:[0-9]+)?$",
    # CRITICAL: Allow credentials for cookies to be sent/received
    allow_credentials=True,
    # Restrict HTTP methods to what's needed
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    # Whitelist specific headers instead of "*"
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",  # For CSRF protection
        "X-Requested-With",
    ],
    # Expose any custom response headers the frontend needs
    expose_headers=["Content-Length", "X-CSRF-Token"],
    # Cache preflight requests for 1 hour
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

# Mount uploads folder for serving user-uploaded images
uploads_path = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(uploads_path):
    os.makedirs(uploads_path)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")
