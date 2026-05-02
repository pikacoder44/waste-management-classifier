import os
from dotenv import load_dotenv

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 20  # 20 minutes - standard admin session timeout

load_dotenv()  # Load environment variables from .env file
