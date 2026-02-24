# Waste Classification System (FYP Prototype)

A machine learning–powered web app that classifies waste images and returns predicted class with confidence.

## Overview

This prototype combines a FastAPI backend, a Next.js frontend, and a TensorFlow/Keras CNN model to perform image-based waste classification.

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

## API Endpoints

- `POST /predict` — classify an image
- `GET /evaluation` — model metrics
- `GET /about` — model details

## Notes

- Model file: `backend/model/waste_classifier_model.keras`
- Status: Prototype (Feb 2026)

# Conclusion


This is a prototype of my CS619 Final Year Project. The requirements were given to me by my supervisor, and I implemented the project based on those requirements. The project is a waste classification system that uses a machine learning model to classify images of waste into different categories. The backend is built using FastAPI, and the frontend is built using Next.js with Tailwind CSS for styling. The machine learning model is a convolutional neural network (CNN) built using TensorFlow/Keras.