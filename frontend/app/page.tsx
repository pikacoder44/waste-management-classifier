"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Loader from "./components/Loader";

export default function Home() {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  // File handling states
  const [file, setFile] = useState<File | null>(null); // newly selected file
  const [submittedFile, setSubmittedFile] = useState<File | null>(null); // file actually submitted

  // Prediction result states
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Camera states
  const [isCameraOverlayOpen, setIsCameraOverlayOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ========================================
  // CAMERA FUNCTIONS
  // ========================================
  // Start the device camera and set up video stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch (error) {
      console.error("Error starting camera:", error);
      alert("Error starting camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Open camera overlay modal and initialize camera
  const openCameraOverlay = async () => {
    setIsCameraOverlayOpen(true);
    await startCamera();
  };

  // Close camera overlay modal and stop camera
  const closeCameraOverlay = () => {
    stopCamera();
    setIsCameraOverlayOpen(false);
  };

  // Capture image from camera stream and convert to file
  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const capturedFile = new File([blob], "webcam_capture.jpg", {
        type: "image/jpeg",
      });
      setFile(capturedFile);
      setSubmittedFile(null);
      setResult(null);
      setConfidence(null);
      closeCameraOverlay();
    }, "image/jpeg");
  };

  // ========================================
  // LIFECYCLE & CLEANUP
  // ========================================
  // Cleanup: Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ========================================
  // ERROR HANDLING
  // ========================================
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Validate selected file and update state
  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      showError(
        "Invalid file format. Please upload an image file (e.g. JPG, PNG, WEBP).",
      );
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  // ========================================
  // IMAGE UPLOAD & PREDICTION
  // ========================================
  // Upload image to backend and get waste classification prediction
  const upload_image = async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);
    setConfidence(null);
    setSubmittedFile(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          showError(
            "The file could not be processed. Please upload a valid image.",
          );
        } else {
          console.log("Prediction result:", data);
          setResult(data.predicted_class);
          setConfidence(data.confidence);
          setSubmittedFile(file);
        }
      } else {
        showError("Something went wrong while uploading. Please try again.");
      }
    } catch (error) {
      showError(
        "Could not connect to the server. Please make sure the backend is running.",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasResult = result && submittedFile;

  // ========================================
  // RENDER: MAIN COMPONENT UI
  // ========================================
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-linear-to-br from-rose-50 via-amber-50 to-sky-50 text-slate-900 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-3xl">
        <div className="mb-7 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Upload a picture to{" "}
            <span className="bg-linear-to-r from-rose-500 via-amber-500 to-sky-500 bg-clip-text text-transparent">
              get prediction
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Choose an image from your device or capture one using your camera.
          </p>
        </div>

        <div
          className={`grid items-start transition-all duration-500 ${hasResult || isLoading ? "gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" : "gap-8 md:gap-0 md:grid-cols-[1fr_0fr]"}`}
        >
          {/* ========================================
              UPLOAD FORM SECTION
              ======================================== */}
          <form
            className="w-full md:max-w-104 md:justify-self-center relative overflow-hidden rounded-3xl border border-amber-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-amber-100/80 backdrop-blur-xl flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              upload_image();
            }}
          >
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Upload your image
              </h2>
            </div>

            {/* File upload drag-and-drop area */}
            <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center transition-all duration-300 hover:border-amber-300 hover:bg-white">
              <div className="pointer-events-none space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-inner shadow-rose-100 transition-transform duration-300 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-7 w-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v12m0-12L8.5 7.5M12 4l3.5 3.5M6 13v4.5A2.5 2.5 0 0 0 8.5 20h7a2.5 2.5 0 0 0 2.5-2.5V13"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-medium text-slate-900">
                    Click to choose an image
                  </p>
                  <p className="text-xs text-slate-500">
                    or drag and drop it here
                  </p>
                  {file && (
                    <p className="mt-2 text-xs text-emerald-600">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
              <input
                type="file"
                name="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            {/* Action buttons: Camera and Submit */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                type="button"
                onClick={openCameraOverlay}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 shadow-sm shadow-rose-100 transition-all duration-300 hover:bg-rose-100 hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-rose-50"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8.37722C2 8.0269 2 7.85174 2.01462 7.70421C2.1556 6.28127 3.28127 5.1556 4.70421 5.01462C4.85174 5 5.03636 5 5.40558 5C5.54785 5 5.61899 5 5.67939 4.99634C6.45061 4.94963 7.12595 4.46288 7.41414 3.746C7.43671 3.68986 7.45781 3.62657 7.5 3.5C7.54219 3.37343 7.56329 3.31014 7.58586 3.254C7.87405 2.53712 8.54939 2.05037 9.32061 2.00366C9.38101 2 9.44772 2 9.58114 2H14.4189C14.5523 2 14.619 2 14.6794 2.00366C15.4506 2.05037 16.126 2.53712 16.4141 3.254C16.4367 3.31014 16.4578 3.37343 16.5 3.5C16.5422 3.62657 16.5633 3.68986 16.5859 3.746C16.874 4.46288 17.5494 4.94963 18.3206 4.99634C18.381 5 18.4521 5 18.5944 5C18.9636 5 19.1483 5 19.2958 5.01462C20.7187 5.1556 21.8444 6.28127 21.9854 7.70421C22 7.85174 22 8.0269 22 8.37722V16.2C22 17.8802 22 18.7202 21.673 19.362C21.3854 19.9265 20.9265 20.3854 20.362 20.673C19.7202 21 18.8802 21 17.2 21H6.8C5.11984 21 4.27976 21 3.63803 20.673C3.07354 20.3854 2.6146 19.9265 2.32698 19.362C2 18.7202 2 17.8802 2 16.2V8.37722Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 16.5C14.2091 16.5 16 14.7091 16 12.5C16 10.2909 14.2091 8.5 12 8.5C9.79086 8.5 8 10.2909 8 12.5C8 14.7091 9.79086 16.5 12 16.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Use camera
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm sm:text-base font-medium text-white shadow-lg shadow-slate-300/60 transition-all duration-300 hover:bg-slate-800 hover:shadow-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!file || isLoading}
              >
                Analyze image
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-slate-900 shadow-inner shadow-slate-200">
                  AI
                </span>
              </button>
            </div>

            {/* Decorative background blurs */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
          </form>

          {/* ========================================
              RESULTS DISPLAY SECTION
              ======================================== */}
          <div
            className={`min-w-0 overflow-hidden relative transform rounded-3xl border border-rose-100 bg-white/90 p-6 sm:p-7 shadow-xl shadow-rose-100/80 backdrop-blur-xl transition-all duration-500 ease-out ${
              hasResult || isLoading
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
          >
            {/* Show loading spinner or results */}
            {isLoading ? (
              <Loader />
            ) : (
              <>
                {/* Results header */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Result
                    </p>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                      Prediction overview
                    </h2>
                  </div>
                </div>

                {hasResult ? (
                  <div className="space-y-4">
                    {/* Image preview and prediction details */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                      <div className="relative mx-auto sm:mx-0 h-40 w-40 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 shadow-lg shadow-blue-100">
                        <Image
                          src={URL.createObjectURL(submittedFile as File)}
                          alt="Uploaded Image"
                          width={200}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-rose-200/35 via-transparent to-transparent" />
                      </div>

                      {/* Predicted class and confidence score */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Predicted class
                          </p>
                          <p className="mt-1 inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-emerald-600">
                            {result}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Confidence
                          </p>
                          <div className="mt-1 flex items-center gap-3">
                            <p className="text-base font-semibold text-emerald-600">
                              {(confidence * 100).toFixed(2)}%
                            </p>
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200 border border-gray-200">
                              <div
                                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, confidence * 100),
                                  ).toFixed(1)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Empty state - no results yet
                  <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                    <p>No prediction yet.</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Upload an image and submit it to see the result here with
                      a smooth reveal animation.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================
          ERROR MODAL
          ======================================== */}
      {error && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-md animate-[slideDown_0.3s_ease-out]">
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white/95 px-5 py-4 shadow-xl shadow-red-100/60 backdrop-blur-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Invalid file</p>
              <p className="mt-0.5 text-xs text-red-600/80">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 rounded-full p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ========================================
          CAMERA OVERLAY MODAL
          ======================================== */}
      {isCameraOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={closeCameraOverlay}
              className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Close
            </button>
            {/* Camera preview header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Camera preview
              </h2>
              <p className="text-xs text-slate-500">
                Position the waste item in the frame, then capture an image.
              </p>
            </div>
            {/* Video stream preview */}
            <div className="overflow-hidden rounded-xl bg-black/80">
              <video
                ref={videoRef}
                className="h-64 w-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {/* Camera control buttons */}
            <div className="mt-4 flex flex-wrap justify-between gap-3">
              <button
                type="button"
                onClick={isCameraOn ? stopCamera : startCamera}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
              >
                {isCameraOn ? "Stop camera" : "Start camera"}
              </button>
              <button
                type="button"
                onClick={captureFromCamera}
                disabled={!isCameraOn}
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Capture image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
