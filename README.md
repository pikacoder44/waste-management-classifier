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
- **Training/Evaluation Progress:** Real-time progress tracking with background task processing
- **Classification Monitoring:** View all user classifications and system activity
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

## 📁 Project Structure

```
code/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── admin_routes.py        # Admin endpoints (dataset, model, training)
│   │   │       ├── auth_routes.py         # Authentication (register, login, logout)
│   │   │       └── classification_routes.py # Classification & history
│   │   ├── ai/
│   │   │   ├── imageQualityAnalysis.py    # Image quality checks
│   │   │   ├── model_loader.py            # Model loading
│   │   │   ├── predict.py                 # Prediction logic
│   │   │   └── preprocess.py              # Image preprocessing
│   │   ├── core/
│   │   │   └── config.py                  # Configuration & secrets
│   │   ├── database/
│   │   │   ├── collections.py             # MongoDB collection references
│   │   │   └── connection.py              # Database connection
│   │   ├── models/
│   │   │   ├── admin_models.py            # Admin request schemas
│   │   │   ├── dataset.py                 # Dataset schema
│   │   │   ├── disposal_recommendation.py # Disposal recommendations
│   │   │   ├── model_evaluation.py        # Evaluation results schema
│   │   │   ├── user.py                    # User schema
│   │   │   └── waste_records.py          # Waste classification history schema
│   │   ├── security/
│   │   ├── services/
│   │   │   ├── model_evaluation_service.py # Evaluation logic
│   │   │   ├── recommendation_service.py  # Disposal recommendations
│   │   │   └── split_dataset_services.py  # Dataset splitting
│   │   ├── utils/
│   │   │   └── helpers.py                 # Utility functions
│   │   └── main.py                        # FastAPI app entry point
│   ├── dataset/
│   │   ├── original/                      # Original training data (6 categories)
│   │   └── custom/                        # User-uploaded custom datasets
│   ├── model/
│   │   └── waste_classifier_model.keras   # Trained model file
│   ├── evaluation_results/                # Stored confusion matrices and metrics
│   ├── requirements.txt                   # Python dependencies
│   └── venv/                              # Virtual environment
├── frontend/
│   ├── app/
│   │   ├── about/                         # About page
│   │   ├── admin/
│   │   │   ├── classifications/           # View all classifications
│   │   │   ├── datasets/                  # Dataset management
│   │   │   ├── evaluation/                # Model evaluation results
│   │   │   ├── retrain/                   # Model retraining
│   │   │   └── upload/                    # Dataset upload
│   │   ├── auth/
│   │   │   └── login/                     # Login page
│   │   ├── components/
│   │   │   ├── Loader.tsx                 # Loading indicator
│   │   │   └── Navbar.tsx                 # Navigation bar
│   │   ├── globals.css                    # Global styles
│   │   ├── layout.tsx                     # Root layout
│   │   └── page.tsx                       # Home page (classification)
│   ├── public/                            # Static assets
│   ├── utils/
│   │   └── evaluation_results.json        # Cached evaluation data
│   ├── package.json                       # Node.js dependencies
│   ├── tsconfig.json                      # TypeScript config
│   ├── next.config.ts                     # Next.js config
│   └── eslint.config.mjs                  # ESLint config
├── LICENSE                                # MIT License
└── README.md                              # This file
```

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
cat > .env << EOF
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=waste_classifier
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EOF

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

## 🌐 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **ReDoc:** http://localhost:8000/redoc

## 📚 Available Users

### Admin Credentials

```
Username: admin
Password: (configured in database)
Role: admin
```

### Regular User

```
Register via: POST /auth/register
Role: user (automatic)
```

## 🔐 Security Features

- **JWT Authentication:** Secure token-based authentication
- **HTTP-Only Cookies:** Prevents XSS attacks
- **CORS Protection:** Configured for localhost development
- **CSRF Protection:** X-CSRF-Token support
- **Password Hashing:** bcrypt with salt
- **Role-Based Access Control:** Admin vs User permissions
- **Trusted Host Middleware:** Prevents Host header attacks

## 🎨 Frontend Pages

- **Home (`/`)** - Main classification interface
- **About (`/about`)** - Project information
- **Evaluation (`/evaluation`)** - Model performance metrics
- **Login (`/auth/login`)** - Authentication page
- **Admin Dashboard (`/admin/`)** - Restricted admin access
  - Classifications - View all user classifications
  - Datasets - Manage training datasets
  - Upload - Upload new dataset
  - Retrain - Monitor model retraining

## 🔧 Environment Variables

### Backend (.env)

```
DATABASE_URL=mongodb://localhost:27017
DATABASE_NAME=waste_classifier
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Quality Improvements

**Image Quality Thresholds (Optimized for real-world waste):**

- MIN_RESOLUTION: 160×160px (was 224×224 - allows smaller smartphone photos)
- BLUR_THRESHOLD: 80 (was 100 - more lenient for casual photos)
- MIN_BRIGHTNESS: 20 (was 30 - allows darker indoor photos)
- MAX_BRIGHTNESS: 235 (was 225 - allows bright outdoor lighting)
- Quality threshold to pass: 60% (was 70% - more realistic for user experience)

This enables images like 275×183px to be processed while still catching genuinely unusable photos.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.
