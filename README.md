# Waste Classification System (FYP Prototype)

A machine learning–powered web app that classifies waste images and returns predicted class with confidence.

## Overview

This prototype combines a FastAPI backend, a Next.js frontend, and a TensorFlow/Keras CNN model to perform image-based waste classification.

## Waste Categories

The model classifies waste into the following categories:

- Cardboard
- Paper
- Metal
- Glass
- Plastic
- Trash

## Dataset

- **Source:** [TrashNet dataset](https://www.kaggle.com/datasets/feyzazkefe/trashnet) from Kaggle
- **Size:** 2,527 classified images across 6 waste categories
- **Preprocessing:** Images resized to 224x224 pixels, normalized (pixel values scaled to 0–1)
- **Augmentation:** Rotation (20°), width/height shift (0.2), zoom (0.2), horizontal flip

## Model Details

| Parameter         | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Architecture**  | MobileNetV2 (transfer learning)                                                                                |
| **Input Size**    | 224 x 224 x 3 (RGB)                                                                                            |
| **Custom Layers** | GlobalAveragePooling2D → Dense(256, ReLU) → Dropout(0.5) → Dense(128, ReLU) → Dropout(0.3) → Dense(6, Softmax) |
| **Optimizer**     | Adam                                                                                                           |
| **Loss Function** | Categorical Crossentropy                                                                                       |
| **Epochs**        | 5                                                                                                              |
| **Batch Size**    | 32                                                                                                             |

## Tech Stack

- **Backend:** FastAPI (Python), TensorFlow/Keras, Uvicorn, Pillow, NumPy, scikit-learn
- **Frontend:** Next.js (TypeScript/React), Tailwind CSS, Fetch API
- **Model:** TensorFlow/Keras

## Project Structure (high level)

- `backend/` — API, model loading, evaluation metrics
- `frontend/` — UI, image upload, results display
- `gitignore` — ignores virtual environments, node_modules, and other non-essential files
- `README.md` — project overview

## Run Locally

### Backend

- `cd backend`
- `python -m venv venv`
- `venv\Scripts\activate`
- `pip install -r requirements.txt`
- `uvicorn main:app --reload`

### Frontend

- `cd frontend`
- `npm install`
- `npm run dev`

## Ports

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

## API Endpoints

- `POST /predict` — classify an image

## Notes

- Model file: `backend/model/waste_classifier_model.keras`
- Status: Prototype (Feb 2026)

# Conclusion

This is a prototype of my CS619 Final Year Project. The requirements were given to me by my supervisor, and I implemented the project based on those requirements. The project is a waste classification system that uses a machine learning model to classify images of waste into different categories. The backend is built using FastAPI, and the frontend is built using Next.js with Tailwind CSS for styling. The machine learning model is a convolutional neural network (CNN) built using TensorFlow/Keras.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details
