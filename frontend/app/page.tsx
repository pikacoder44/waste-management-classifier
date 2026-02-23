"use client";
import { useState } from "react";
import Image from "next/image";
export default function Home() {
  const [file, setFile] = useState(null);           // newly selected file
  const [submittedFile, setSubmittedFile] = useState(null); // file actually submitted
  const [result, setResult] = useState(null);
  const [confidence, setConfidence] = useState(null);

  const upload_image = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Prediction result:", data);
        setResult(data.predicted_class);
        setConfidence(data.confidence);
        setSubmittedFile(file); // store the file that gave this result
      } else {
        console.error("Error uploading image:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center text-black bg-zinc-50 font-sans">
      <h3 className="text-3xl font-semibold mb-4">Please Upload the picture</h3>

      <form
        className="flex flex-col items-center gap-4 bg-gray-100 p-6 rounded-lg shadow-md"
        onSubmit={(e) => {
          e.preventDefault();
          upload_image();
        }}
      >
        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="border border-gray-300 bg-gray-500 text-white rounded-lg p-2 cursor-pointer"
        />
        <button
          type="submit"
          className="bg-green-600 px-4 py-2 rounded-2xl hover:bg-green-800 hover:text-white cursor-pointer"
        >
          Submit
        </button>
      </form>

      {result && submittedFile && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg shadow-md flex flex-col items-center">
          <Image
            src={URL.createObjectURL(submittedFile)}
            alt="Uploaded Image"
            width={200}
            height={200}
            className="mb-4 rounded-lg"
          />
          <h4 className="text-xl font-semibold mb-2">Prediction Result:</h4>
          <p className="text-lg">Predicted Class: {result}</p>
          <p className="text-lg">Confidence: {(confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}