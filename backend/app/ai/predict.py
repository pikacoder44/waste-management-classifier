import numpy as np


def predict_image(image_array, model, class_labels):
    try:
        # Make prediction using the loaded model
        predictions = model.predict(image_array)
        predicted_class_index = np.argmax(predictions[0])
        predicted_class_label = class_labels[predicted_class_index]
        confidence = float(predictions[0][predicted_class_index])
        return predicted_class_label, confidence
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise ValueError("Prediction failed due to an error with the input image.")
