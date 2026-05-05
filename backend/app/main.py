from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Map Pydantic/FastAPI validation errors to friendlier messages.

    This replaces technical messages like "string should have at least 8 characters"
    with clearer, field-specific phrases that are safe to return to clients.
    """
    errors = exc.errors()
    new_errors = []
    for err in errors:
        new_err = err.copy()
        loc = err.get("loc", [])
        field = loc[-1] if loc else None
        type_ = err.get("type", "")
        ctx = err.get("ctx") or {}

        # Shorter/softer, field-specific messages
        if "min_length" in type_:
            limit = ctx.get("limit_value")
            if field == "password":
                new_err["msg"] = "Please use a password with at least 8 characters."
            elif field == "username":
                new_err["msg"] = "Username must be at least 3 characters."
            else:
                if limit:
                    new_err["msg"] = (
                        f"{str(field).capitalize() if field else 'Field'} must be at least {limit} characters."
                    )
                else:
                    new_err["msg"] = "Value is too short."
        elif "max_length" in type_:
            limit = ctx.get("limit_value")
            if limit:
                new_err["msg"] = (
                    f"{str(field).capitalize() if field else 'Field'} must be at most {limit} characters."
                )
            else:
                new_err["msg"] = "Value is too long."
        elif "missing" in type_ or type_.endswith("value_error.missing"):
            new_err["msg"] = (
                f"{str(field).capitalize() if field else 'Field'} is required."
            )
        else:
            # Default to the original message but keep it user-friendly
            new_err["msg"] = err.get("msg", "Invalid input.")

        new_errors.append(new_err)

    return JSONResponse(status_code=422, content={"detail": new_errors})


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
