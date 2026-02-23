# Waste Classification System - FYP Prototype

**Final Year Project (FYP) Prototype Code**

A machine learning-powered web application for waste classification that helps users identify and categorize waste items using computer vision and deep learning.

## 📋 Project Overview

This is a prototype implementation of an intelligent waste classification system developed as a Final Year Project. The system uses a trained deep learning model to classify waste items from images and provides confidence scores for predictions.

## 🏗️ Architecture

The project is built with a **full-stack architecture**:

- **Backend**: Python with FastAPI framework
- **Frontend**: Next.js with TypeScript and React
- **ML Model**: TensorFlow/Keras trained waste classifier

### System Diagram

```
┌─────────────────────────────────────────────┐
│         Next.js Frontend (Port 3000)        │
│  - Image Upload Interface                   │
│  - Prediction Results Display               │
│  - Model Information & Evaluation Stats     │
└──────────────────┬──────────────────────────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────────┐
│      FastAPI Backend (Port 8000)            │
│  - /predict - Image classification          │
│  - /evaluation - Model metrics              │
│  - /model-info - Model details              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   TensorFlow/Keras ML Model                 │
│  - waste_classifier_model.keras             │
└─────────────────────────────────────────────┘
```

## 🚀 Key Features

- ✅ **Image Upload**: Users can upload waste item images for classification
- ✅ **Real-time Predictions**: Get instant waste classification with confidence scores
- ✅ **Model Evaluation**: View model performance metrics and evaluation results
- ✅ **Responsive UI**: Modern, user-friendly web interface
- ✅ **REST API**: Well-structured API endpoints for predictions and model information

## 📁 Project Structure

```
.
├── backend/                          # Python FastAPI Backend
│   ├── main.py                       # API endpoints and server configuration
│   ├── requirements.txt               # Python dependencies
│   ├── dependencies.md                # Documentation of dependencies
│   ├── workplan.md                    # Development workplan
│   ├── model/
│   │   └── waste_classifier_model.keras  # Trained ML model
│   ├── utils/
│   │   └── evaluation_results.json    # Model evaluation metrics
│   └── __pycache__/                  # Python cache (ignored in git)
│
├── frontend/                         # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx                  # Home page - image upload
│   │   ├── predict/
│   │   │   └── page.tsx              # Prediction results page
│   │   ├── layout.tsx                # Root layout component
│   │   └── globals.css               # Global styles
│   ├── public/                       # Static assets
│   ├── package.json                  # Node.js dependencies
│   ├── next.config.ts                # Next.js configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── eslint.config.mjs             # ESLint configuration
│   ├── postcss.config.mjs            # PostCSS configuration
│   ├── next-env.d.ts                 # Next.js type definitions
│   └── README.md                     # Frontend-specific documentation
│
└── .gitignore                        # Git ignore rules
```

## 🛠️ Tech Stack

### Backend

- **FastAPI** - Modern Python web framework for building APIs
- **Uvicorn** - ASGI server for running the FastAPI application
- **TensorFlow/Keras** - Deep learning framework for the ML model
- **Pillow** - Image processing library
- **NumPy** - Numerical computing library
- **Pydantic** - Data validation using Python type hints

### Frontend

- **Next.js** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Node.js** - JavaScript runtime

## 📋 API Endpoints

| Method | Endpoint      | Description                               |
| ------ | ------------- | ----------------------------------------- |
| POST   | `/predict`    | Upload image and get waste classification |
| GET    | `/evaluation` | Get model evaluation metrics              |
| GET    | `/model-info` | Get model information and details         |

### Example Request/Response

**POST /predict**

```bash
curl -X POST "http://localhost:8000/predict" \
  -F "file=@image.jpg"
```

**Response:**

```json
{
  "predicted_class": "plastic",
  "confidence": 0.95
}
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+ (for backend)
- Node.js 18+ (for frontend)
- pip (Python package manager)
- npm or yarn (Node package manager)

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Model Information

- **Model Type**: Convolutional Neural Network (CNN)
- **Framework**: TensorFlow/Keras
- **Model File**: `backend/model/waste_classifier_model.keras`
- **Input**: Image file (JPEG, PNG, etc.)
- **Output**: Waste class prediction with confidence score
- **Classes**: Various waste material categories (metal, plastic, glass, paper, organic, etc.)

## 📈 Evaluation Results

Model evaluation metrics are stored in `backend/utils/evaluation_results.json`. This includes:

- Accuracy
- Precision
- Recall
- F1-Score
- Confusion Matrix
- Per-class performance metrics

## 🔧 Development & Testing

### Running Tests

```bash
# Backend tests (if available)
pytest backend/

# Frontend tests (if available)
npm test --prefix frontend
```

### Code Quality

**Backend**:

- Follows PEP 8 style guidelines
- Type hints with Pydantic validation

**Frontend**:

- ESLint configuration included
- TypeScript for type safety
- Prettier for code formatting

## 🤝 Contributing

This is a Final Year Project - contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is provided as-is for educational purposes as part of a Final Year Project.

## 👨‍💻 Author

**Syed Muhammad Hashir Ali** - Virtual University of Pakistan

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TensorFlow/Keras Documentation](https://www.tensorflow.org/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

## 🐛 Known Issues & Future Improvements

- [ ] Add user authentication and authorization
- [ ] Implement batch processing for multiple images
- [ ] Add model retraining capabilities
- [ ] Deploy to cloud platform (AWS/GCP/Azure)
- [ ] Add WebSocket support for real-time predictions
- [ ] Implement caching for frequently predicted items
- [ ] Add comprehensive logging and monitoring
- [ ] Create mobile app version

## ❓ Support

For questions or issues regarding this project, please refer to the documentation in individual directories or contact the project author.

---

**Last Updated**: February 2026
**Status**: Prototype/Development Phase
