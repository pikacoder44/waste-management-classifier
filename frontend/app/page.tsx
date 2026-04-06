"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Loader from "./components/Loader";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [submittedFile, setSubmittedFile] = useState<File | null>(null);

  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [disposalMethod, setDisposalMethod] = useState<string | null>(null);
  const [disposalInstructions, setDisposalInstructions] = useState<
    string | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [isCameraOverlayOpen, setIsCameraOverlayOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const openCameraOverlay = async () => {
    setIsCameraOverlayOpen(true);
    await startCamera();
  };

  const closeCameraOverlay = () => {
    stopCamera();
    setIsCameraOverlayOpen(false);
  };

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
      setDisposalMethod(null);
      setDisposalInstructions(null);
      closeCameraOverlay();
    }, "image/jpeg");
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

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

  const upload_image = async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);
    setConfidence(null);
    setDisposalMethod(null);
    setDisposalInstructions(null);
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
          setDisposalMethod(data.disposal_method);
          setDisposalInstructions(data.disposal_instructions);
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


  return (
    <div className="min-h-screen bg-white text-slate-900 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Waste <span className="text-emerald-600">Classifier</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Advanced AI for waste classification and eco-friendly disposal
            guidance
          </p>
        </div>

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Upload Form - Compact */}
          <div
            className={`transition-all duration-500 ${
              hasResult || isLoading ? "lg:w-96" : "lg:w-96"
            }`}
          >
            <form
              className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              onSubmit={(e) => {
                e.preventDefault();
                upload_image();
              }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Upload Image
                </h2>
                <p className="text-sm text-slate-600">
                  PNG, JPG, or WEBP format
                </p>
              </div>

              {/* Upload Zone */}
              <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 px-6 py-10 text-center transition-all duration-300 mb-6">
                <div className="pointer-events-none space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-7 w-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v12m0-12L8.5 7.5M12 4l3.5 3.5M6 13v4.5A2.5 2.5 0 0 0 8.5 20h7a2.5 2.5 0 0 0 2.5-2.5V13"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      Click or drag & drop
                    </p>
                    {file && (
                      <p className="mt-2 text-xs text-emerald-600 font-medium">
                        ✓ {file.name}
                      </p>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] ?? null)
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!file || isLoading}
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v4a1 1 0 001 1h12a1 1 0 001-1V6a2 2 0 00-2-2H4zm12 12H4a2 2 0 01-2-2v-4a1 1 0 00-1-1H.5a1.5 1.5 0 011.5 1.5v4A4 4 0 004 20h12a4 4 0 004-4v-4a1.5 1.5 0 01-1.5-1.5H16a1 1 0 001 1v4a2 2 0 01-2 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Analyze
                </button>
                <button
                  type="button"
                  onClick={openCameraOverlay}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 px-4 py-3 text-sm font-semibold transition-all duration-300 hover:bg-slate-50"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Camera
                </button>
              </div>
            </form>
          </div>

          {/* Results Card - Slides in from right */}
          {(hasResult || isLoading) && (
            <div className="w-full lg:w-96 animate-slideInFromRight">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        Result
                      </p>
                      <h2 className="text-2xl font-bold text-slate-900 mt-1">
                        Classification
                      </h2>
                    </div>

                    {hasResult && (
                      <div className="space-y-6">
                        {/* Image Preview */}
                        <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
                          <Image
                            src={URL.createObjectURL(submittedFile as File)}
                            alt="Uploaded Image"
                            width={200}
                            height={200}
                            className="h-auto w-full object-cover"
                          />
                        </div>

                        {/* Waste Type Badge */}
                        <div className="text-center space-y-3 py-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            Classification
                          </p>
                          <div className="inline-block bg-linear-to-br from-green-400 to-emerald-600 rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                            <span className="text-3xl font-bold text-white capitalize">
                              {result}
                            </span>
                          </div>
                        </div>

                        {/* Confidence */}
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-700">
                              Confidence
                            </p>
                            <p className="text-lg font-bold text-emerald-600">
                              {(confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, confidence * 100),
                                ).toFixed(1)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Disposal Information */}
                        {disposalMethod && (
                          <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Disposal Method
                              </p>
                              <p className="text-base font-semibold text-slate-900">
                                {disposalMethod}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                How to Dispose
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {disposalInstructions}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[90%] max-w-md animate-slideDown">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
            <svg
              className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-red-900 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={closeCameraOverlay}
              className="absolute right-4 top-4 z-10 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors"
            >
              ✕ Close
            </button>
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Camera</h2>
                <p className="text-slate-600 text-sm">
                  Position waste item and capture
                </p>
              </div>
              <div className="overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={isCameraOn ? stopCamera : startCamera}
                  className="flex-1 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-slate-50"
                >
                  {isCameraOn ? "⊚ Stop" : "⊙ Start"}
                </button>
                <button
                  type="button"
                  onClick={captureFromCamera}
                  disabled={!isCameraOn}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷 Capture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
