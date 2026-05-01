from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is not set")

client = None
db = None
waste_collection = None

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)

    db = client["waste_classifier"]
    waste_collection = db["waste_collection"]
    # Verify connection by pinging the server after the handles exist.
    client.admin.command("ping")
    print("✓ MongoDB connection successful")
    print("✓ Database and collection initialized successfully")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(f"✗ MongoDB connection failed (Network issue): {e}")
except Exception as e:
    print(f"✗ MongoDB connection error: {e}")
    raise Exception(f"Database initialization failed: {e}")
