# Waste Classification System (FYP Prototype)

A machine learning–powered web app that classifies waste images and returns predicted class with confidence. It uses a convolutional neural network (CNN) trained on the TrashNet dataset to classify waste into 6 categories: cardboard, paper, metal, glass, plastic, and trash.
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
- **Size:** ``2,527`` classified images across 6 waste categories
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

## Project Structure

### Backend Files

- `main.py` — FastAPI application with `/predict` endpoint for image classification
- `model_training.py` — Script to train the MobileNetV2 model on the TrashNet dataset with data augmentation
- `evaluation_of_model.py` — Script to evaluate the trained model on test data and generate metrics (accuracy, precision, recall, F1-score, confusion matrix)
- `requirements.txt` — Python dependencies
- `dataset/` — Training and test image directories - not included in the repository due to size (download from Kaggle)
- `model/` — Trained model file (`waste_classifier_model.keras`)
- `utils/` — Utility files (class indices JSON)

### Frontend Files

- `app/` — Next.js pages and components
  - `page.tsx` — Home page with image upload
  - `about/page.tsx` — About page
  - `evaluation/page.tsx` — Evaluation metrics display page
  - `components/` — Reusable React components
- `utils/` — Utility files including evaluation results
- `package.json` — Node.js dependencies

### Project Root

- `LICENSE` — MIT License
- `README.md` — Project documentation

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


## Model Training & Evaluation

### Training the Model

To train the model on the TrashNet dataset:

```bash
cd backend
python model_training.py
```

This script will:

- Load images from `dataset/train/` and `dataset/test/`
- Apply data augmentation (rotation, shift, zoom, flip)
- Train a MobileNetV2-based CNN for waste classification
- Save the trained model to `model/waste_classifier_model.keras`
- Display training and validation loss/accuracy plots

### Evaluating the Model

To evaluate the trained model on test data:

```bash
cd backend
python evaluation_of_model.py
```

This script will:

- Load the trained model from `model/waste_classifier_model.keras`
- Run predictions on test images in `dataset/test/`
- Generate evaluation metrics: **Accuracy**, **Precision**, **Recall**, **F1-Score**
- Create a **Confusion Matrix** heatmap visualization
- Save results to `frontend/utils/evaluation_results.json` for frontend display



## API Endpoints

- `POST /predict` — classify an image


# Conclusion

This is a prototype of my CS619 Final Year Project. The requirements were given to me by my supervisor, and I implemented the project based on those requirements. The project is a waste classification system that uses a machine learning model to classify images of waste into different categories. The backend is built using FastAPI, and the frontend is built using Next.js with Tailwind CSS for styling. The machine learning model is a convolutional neural network (CNN) built using TensorFlow/Keras.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details
