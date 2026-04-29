import os
from dotenv import load_dotenv

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = (
    1440  # 24 hours (24 * 60 minutes) - sufficient for admin sessions
)

load_dotenv()  # Load environment variables from .env file
