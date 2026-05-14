from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is not set")

client = None
db = None

try:
    client = MongoClient(
        MONGO_URL, serverSelectionTimeoutMS=5000
    )  # server timeout - 5 seconds
    db = client["waste_classifier"]
    # test connection
    client.admin.command("ping")
    print("MongoDB connection successful")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(f"MongoDB connection failed: {e}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    raise Exception(f"Database initialization failed: {e}")
