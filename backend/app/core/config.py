import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
# Access token lifetime in minutes.
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours
