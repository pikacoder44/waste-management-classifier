"use client";
import { useState, useEffect } from "react";
function Predict() {
  const [prediction, setPrediction] = useState(null);
  
  useEffect(() => {
    // call the backend API to get the prediction result
    fetch("http://localhost:8000/predict", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        setPrediction(data.predicted_class);
      })
      .catch((error) => {
        console.error("Error fetching prediction:", error);
      });
  }, []);

  return <div>Predicted Waste Type: {prediction}</div>;
}

export default Predict;
