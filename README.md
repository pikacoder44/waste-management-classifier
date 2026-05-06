# Waste Classification System (FYP)

A full-stack machine learning web application for waste classification with user authentication, admin dashboard, dataset management, and model retraining capabilities. The system uses a **MobileNetV2** transfer learning model trained on the TrashNet dataset to classify waste images into 6 categories.

## 🎯 Features

### Core Features

- **Image Classification:** Real-time waste image classification with confidence scores
- **User Authentication:** JWT-based authentication with HTTP-only cookies
- **Role-Based Access Control:** Admin and User roles with different permissions
- **Classification History:** Users can view their classification history
- **Image Quality Analysis:** Pre-classification quality checks with feedback

### Admin Features

- **Dataset Management:** Upload, update, and delete custom datasets
- **Model Retraining:** Retrain model with original and custom datasets
- **Model Evaluation:** Evaluate model performance with metrics (accuracy, precision, recall, F1-score, confusion matrix)
- **Training/Evaluation Progress:** Background task processing with status updates
- **Classification Monitoring:** View all user classifications
- **Image Quality Checks:** Automatically validate and enhance low-quality uploads before inference

## 📊 Waste Categories

The model classifies waste into 6 categories:

- Cardboard
- Paper
- Metal
- Glass
- Plastic
- Trash

## 🗂️ Dataset

- **Source:** [TrashNet dataset](https://www.kaggle.com/datasets/feyzazkefe/trashnet) from Kaggle
- **Size:** 2,527 classified images across 6 waste categories
- **Preprocessing:** Images resized to 224×224 pixels, normalized (0–1 range)
- **Augmentation:** Rotation (20°), width/height shift (0.2), zoom (0.2), horizontal flip
- **Custom Datasets:** Support for uploading additional training data via admin panel
- **Storage:** Uploaded images are stored locally in the backend `uploads/` folder and served through FastAPI

## 🤖 Model Architecture

| Parameter               | Value                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Base Model**          | MobileNetV2 (ImageNet weights, transfer learning)                                                              |
| **Input Size**          | 224 × 224 × 3 (RGB)                                                                                            |
| **Custom Layers**       | GlobalAveragePooling2D → Dense(256, ReLU) → Dropout(0.5) → Dense(128, ReLU) → Dropout(0.3) → Dense(6, Softmax) |
| **Optimizer**           | Adam (learning rate: 0.001)                                                                                    |
| **Loss Function**       | Categorical Crossentropy                                                                                       |
| **Batch Size**          | 32                                                                                                             |
| **Epochs**              | 20 (with EarlyStopping, patience: 5)                                                                           |
| **Training/Test Split** | 70/30                                                                                                          |

## 🏗️ Tech Stack

### Backend

- **Framework:** FastAPI (Python)
- **ML/AI:** TensorFlow/Keras, scikit-learn
- **Database:** MongoDB
- **Authentication:** JWT and bcrypt
- **Image Upload:** Local filesystem storage
- **Server:** Uvicorn

### Frontend

- **Framework:** Next.js 16+ (React 19, TypeScript)
- **Styling:** Tailwind CSS 4
- **State Management:** React hooks
- **HTTP Client:** Fetch API with credentials support

## 🔗 API Endpoints

### Authentication (`/auth/`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user (returns JWT in HTTP-only cookie)
- `POST /auth/logout` - Logout and clear session

### Classification (`/classification/`)

- `POST /classification/analyze` - Classify waste image (requires auth)
- `GET /classification/history` - Get user's classification history (requires auth)
- `DELETE /classification/history/{entry_id}` - Delete classification entry (requires auth)

### Admin (`/admin/`) - Requires admin authentication

#### Dataset Management

- `POST /admin/dataset/upload` - Upload dataset batch
- `PUT /admin/dataset/update` - Update dataset details & images
- `GET /admin/datasets` - List all datasets
- `GET /admin/dataset/{dataset_id}` - Get dataset details
- `DELETE /admin/dataset/delete` - Delete dataset

#### Model Training & Evaluation

- `POST /admin/model/retrain` - Start model retraining (background task)
- `GET /admin/model/status` - Get training progress
- `POST /admin/model/evaluate` - Start model evaluation (background task)
- `GET /admin/model/evaluation/status` - Get evaluation progress
- `GET /admin/model/evaluation/latest` - Get latest evaluation results

#### Monitoring

- `GET /admin/classification/history` - View all user classifications

## 💾 Database Collections (MongoDB)

- **users** - User accounts with credentials
- **waste_records** - Classification results with image metadata
- **datasets** - Custom training datasets
- **model_evaluations** - Model performance metrics & confusion matrices

## 🗃️ Storage

- **Uploaded images** - Stored locally under `backend/uploads/` and served by FastAPI

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB 4.4+
- MongoDB running locally or in your network environment

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file with required variables
# Add these values to backend/.env
MONGO_URL=mongodb://localhost:27017
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=20

# 6. Run backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)

```
# MongoDB Configuration
# Option 1: Atlas Cloud Connection
# MONGO_URL=mongodb+srv://username:password@clustername.mongodb.net/?appName=ClusterMain

# Option 2: Local MongoDB Connection (for local development)
MONGO_URL=mongodb://localhost:27017/waste_classifier
MONGO_DB_NAME=waste_classifier

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD= (your-admin-password-here)

# JWT Configuration
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 hours

# TensorFlow Configuration
TF_ENABLE_ONEDNN_OPTS=0
```

### Database Setup for Local Development

A `db_dump/` folder is included containing MongoDB collections for quick local setup:

```bash
# Restore database using (requires MongoDB running locally):
mongorestore --db waste_classifier ./backend/db_dump/waste_classifier
```

This includes:

- Pre-configured admin user (username: `admin`, password: ` (your-admin-password-here)`)
- Sample datasets and classifications
- Pre-calculated model evaluation metrics
- Full training history

## 🎨 Quality Improvements

**Image Quality Thresholds:**

- MIN_RESOLUTION: 224×224px
- BLUR_THRESHOLD: 100
- MIN_BRIGHTNESS: 30
- MAX_BRIGHTNESS: 225
- Quality threshold to pass: 70%

Images below these thresholds are rejected unless they can be enhanced successfully.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.
