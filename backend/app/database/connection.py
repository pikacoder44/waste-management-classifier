from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is not set")

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    # Verify connection by pinging the server
    client.admin.command("ping")
    print("✓ MongoDB connection successful")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(f"✗ Failed to connect to MongoDB: {e}")
    raise Exception(f"MongoDB connection failed: {e}")
except Exception as e:
    print(f"✗ Unexpected error connecting to MongoDB: {e}")
    raise Exception(f"MongoDB connection error: {e}")

try:
    db = client["waste_classifier"]
    waste_collection = db["waste_collection"]
    print("✓ Database and collection initialized successfully")
except Exception as e:
    print(f"✗ Error initializing database or collection: {e}")
    raise Exception(f"Database initialization failed: {e}")
