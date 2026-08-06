from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pathlib import Path
from app.api.routes import auth_routes
from app.api.routes import classification_routes
from app.api.routes import admin_routes

BACKEND_ROOT = Path(__file__).resolve().parents[1]

app = FastAPI(
    title="Waste Classifier API",
    description="Secure waste classification system",
    version="1.0.0",
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    # Map Pydantic validation errors to friendlier messages.

    errors = exc.errors()  # get all validation errors
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

    # Build a concise error string plus the detailed list for clients
    messages = [e.get("msg", "Invalid input") for e in new_errors]
    error_text = ", ".join([m for m in messages if m])
    return JSONResponse(
        status_code=422, content={"error": error_text, "detail": new_errors}
    )


# CORS has to allow credentials so auth cookies work.
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost",
        "127.0.0.1",
        "*.localhost",
        "localhost:8000",
        "127.0.0.1:8000",
        "waste-management-classifier-production.up.railway.app",
        "*.up.railway.app",
    ],
)


@app.get("/")
def root():
    return {"message": "Waste Classifier API is running"}


app.include_router(auth_routes.router)
app.include_router(classification_routes.router)
app.include_router(admin_routes.router)


dataset_path = BACKEND_ROOT / "dataset"
if dataset_path.exists():
    app.mount(
        "/dataset", StaticFiles(directory=str(dataset_path)), name="dataset"
    )  # mounts dataset directory as static files

uploads_path = BACKEND_ROOT / "uploads"
if not uploads_path.exists():
    uploads_path.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads", StaticFiles(directory=str(uploads_path)), name="uploads"
)  # mounts uploads directory as static files


evaluation_results_path = BACKEND_ROOT / "evaluation_results"
if not evaluation_results_path.exists():
    evaluation_results_path.mkdir(parents=True, exist_ok=True)

app.mount(
    "/evaluation_results",
    StaticFiles(directory=str(evaluation_results_path)),
    name="evaluation_results",
)
