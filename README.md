# Waste Classification System (FYP Prototype)

A machine learning–powered web app that classifies waste images and returns predicted class with confidence.

## Overview

This prototype combines a FastAPI backend, a Next.js frontend, and a TensorFlow/Keras CNN model to perform image-based waste classification.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** Next.js (TypeScript/React)
- **Model:** TensorFlow/Keras

## Project Structure (high level)

- `backend/` — API, model loading, evaluation metrics
- `frontend/` — UI, image upload, results display
- `README.md` — project overview

## Run Locally

### Backend

- `cd backend`
- `python -m venv venv`
- `venv\Scripts\activate`
- `pip install -r requirements.txt`
- `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### Frontend

- `cd frontend`
- `npm install`
- `npm run dev`

## API Endpoints

- `POST /predict` — classify an image
- `GET /evaluation` — model metrics
- `GET /model-info` — model details

## Notes

- Model file: `backend/model/waste_classifier_model.keras`
- Status: Prototype (Feb 2026)
