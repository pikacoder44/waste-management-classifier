"use client";
import { useEffect, useRef, useState, useContext } from "react";
import Image from "next/image";
import Loader from "./components/Loader";
import { AuthContext } from "./context/AuthContext";
import {
  getCategoryIcon,
  getCategoryColorMain,
} from "@/app/components/CategoryComponents";
import { HelpCircle } from "lucide-react";
import formatDate from "@/app/utils/formatDate";

interface DisposalRecommendation {
  disposal_method: string;
  description: string;
  benefits: string;
}

export default function Home() {
  const authContext = useContext(AuthContext);
  const isLoggedIn =
    authContext?.role !== null && authContext?.role !== undefined;
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [disposalRecommendation, setDisposalRecommendation] =
    useState<DisposalRecommendation | null>(null);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);
  const [submittedFile, setSubmittedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedError, setIsUnauthorizedError] = useState(false);
  const [isCameraOverlayOpen, setIsCameraOverlayOpen] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  // DOM references for video and canvas elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confidenceValue = confidence ?? 0;

  // Converts backend API error responses into readable messages for the user
  const parseApiErrorMessage = async (
    response: Response,
    fallbackMessage: string,
  ): Promise<string> => {
    try {
      const raw = await response.text();

      if (!raw) {
        return fallbackMessage;
      }

      try {
        const data = JSON.parse(raw) as {
          detail?: unknown;
          message?: unknown;
          errors?: Array<{ error?: string }>;
        };
        // Check for structured error messages in the response
        if (typeof data.detail === "string") {
          return data.detail;
        }
        // If 'detail' is an array, join the messages
        if (Array.isArray(data.detail)) {
          const joined = data.detail
            .map((entry) =>
              entry && typeof entry === "object"
                ? (entry as { msg?: string }).msg
                : null,
            )
            .filter((item): item is string => Boolean(item))
            .join(", ");

          if (joined) {
            return joined;
          }
        }
        // Check for 'message' field in the response
        if (typeof data.message === "string") {
          return data.message;
        }
        // If 'message' is an array, join the messages
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const joined = data.errors
            .map((entry) => entry.error)
            .filter((item): item is string => Boolean(item))
            .join(", ");
          if (joined) {
            return joined;
          }
        }

        return fallbackMessage;
      } catch {
        return raw.trim() || fallbackMessage;
      }
    } catch {
      return fallbackMessage;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // Request camera access
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
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop()); // Stop all tracks
      videoRef.current.srcObject = null; // Disconnect the stream
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

  // Live Camera -> Copy Frame to Canvas -> Convert to Blob -> Create File -> Store inside file state
  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d"); // Get the 2D rendering context of the canvas
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height); // Draw the current video frame onto the canvas

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

  useEffect(() => {
    // Runs when page closes
    return () => {
      stopCamera();
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Popup error modal for 5 seconds
  const showError = (message: string, isUnauthorized: boolean = false) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    setError(message);
    setIsUnauthorizedError(isUnauthorized);
    // Set timer for 5 seconds to modal to show up
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
      setIsUnauthorizedError(false);
      errorTimeoutRef.current = null;
    }, 5000);
  };

  // Handle file selection and validation
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

  // Upload image to backend for classification
  const upload_image = async () => {
    if (!file) return; // No file selected, exit early

    setIsLoading(true);

    // Backup check in case of server connection issues, to show last successful result
    const hasBackup = Boolean(result && submittedFile);

    // Prepare form data for the POST request
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/classification/analyze`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      if (response.status == 401) {
        showError(
          "You must be logged in to classify images. Please login to your account.",
          true,
        );
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          showError(
            "The file could not be processed. Please upload a valid image.",
          );
        } else {
          setResult(data.label);
          setConfidence(data.confidence);
          setInferenceTime(data.inferenceTime);
          // Set disposal recommendation if available
          if (data.disposalRecommendation) {
            setDisposalRecommendation(data.disposalRecommendation);
          }

          setSubmittedFile(file);
        }
      } else {
        const apiMessage = await parseApiErrorMessage(
          response,
          "Something went wrong while uploading. Please try again.",
        );
        showError(apiMessage);
      }
    } catch {
      showError(
        hasBackup
          ? "Could not connect to the server. Showing the last successful result."
          : "Could not connect to the server. Please make sure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const hasResult = result && submittedFile;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900 pt-8 pb-16 animate-page-enter">
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl animate-soft-float" />
      <div className="pointer-events-none absolute left-0 top-48 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl animate-soft-float [animation-delay:1300ms]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center space-y-4 animate-fade-in-up">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Waste <span className="text-emerald-600">Classifier</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Advanced AI for waste classification and eco-friendly disposal
            guidance
          </p>
        </div>

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
          {/* Upload Form - Compact */}
          <div className="w-full max-w-md mx-auto transition-all duration-500 lg:w-96 animate-fade-in-up [animation-delay:120ms]">
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

            {/* Login Requirement Notice - Only show when not logged in */}
            {!isLoggedIn && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900 font-medium">
                  ⚠️ <span className="font-semibold">Note:</span> You must be
                  logged in to classify images. Please{" "}
                  <a
                    href="/auth/login"
                    className="underline font-semibold hover:text-amber-950 transition-colors"
                  >
                    login here
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Clean & Professional Results Card */}
          {(hasResult || isLoading) && (
            <div className="w-full animate-fade-in-up [animation-delay:180ms]">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader />
                  </div>
                ) : (
                  hasResult && (
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Image Section - Left */}
                      <div className="bg-linear-to-br from-slate-50 to-slate-100 p-3 flex items-center justify-center">
                        <div className="relative w-72 h-72 rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200">
                          <Image
                            src={URL.createObjectURL(submittedFile as File)}
                            alt="Waste Classification"
                            width={288}
                            height={288}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Results Section - Right */}
                      <div
                        className={`relative p-5 flex flex-col justify-center overflow-hidden ${result ? getCategoryColorMain(result).bg : "bg-white"}`}
                      >
                        {/* Animated Background Accent */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-current"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 space-y-3">
                          {/* Main Category Display */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-[2px] opacity-75">
                              🎯 Classification Result
                            </p>
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-3 rounded-xl shadow-lg transform transition-transform hover:scale-110 ${result ? getCategoryColorMain(result).badge : "bg-gray-200"}`}
                              >
                                {result ? (
                                  getCategoryIcon(result)
                                ) : (
                                  <HelpCircle className="w-10 h-10 text-gray-600" />
                                )}
                              </div>
                              <div>
                                <h2
                                  className={`text-3xl font-black capitalize mb-2 ${result ? getCategoryColorMain(result).text : "text-gray-700"}`}
                                >
                                  {result || "Unknown"}
                                </h2>
                                <div
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${result ? getCategoryColorMain(result).badge + " " + getCategoryColorMain(result).text : "bg-gray-100 text-gray-700"}`}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                                  Detected
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Confidence Score - Enhanced */}
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                📊 Confidence Score
                              </label>
                              <span
                                className={` font-black px-3 py-1 rounded-lg text-sm ${
                                  confidenceValue >= 0.8
                                    ? "bg-green-100 text-green-700"
                                    : confidenceValue >= 0.6
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {(confidenceValue * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-4 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
                              <div
                                className={`h-full transition-all duration-700 rounded-full ${
                                  confidenceValue >= 0.8
                                    ? "bg-linear-to-r from-green-400 to-green-600"
                                    : confidenceValue >= 0.6
                                      ? "bg-linear-to-r from-yellow-400 to-yellow-600"
                                      : "bg-linear-to-r from-red-400 to-red-600"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, confidenceValue * 100),
                                  ).toFixed(1)}%`,
                                }}
                              />
                            </div>
                            <p
                              className={`text-xs font-semibold mt-2 ${
                                confidenceValue >= 0.8
                                  ? "text-green-700"
                                  : confidenceValue >= 0.6
                                    ? "text-yellow-700"
                                    : "text-red-700"
                              }`}
                            >
                              {confidenceValue >= 0.8
                                ? "✓ Excellent confidence - Reliable"
                                : confidenceValue >= 0.6
                                  ? "⚠ Good confidence - Review suggested"
                                  : "✕ Low confidence - Please verify"}
                            </p>
                          </div>

                          <div className="space-y-2 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
                            {disposalRecommendation && (
                              <div>
                                {/* Disposal Method */}
                                <p className="text-sm text-slate-500">
                                  <span className="font-semibold text-slate-700">
                                    Disposal Method:
                                  </span>{" "}
                                  <span className="font-semibold text-slate-900">
                                    {disposalRecommendation.disposal_method}
                                  </span>
                                </p>

                                {/* Recommendation */}
                                <div className="mt-2">
                                  <p className="text-sm font-semibold text-slate-700">
                                    Recommendation
                                  </p>
                                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                    {disposalRecommendation.description}
                                  </p>
                                </div>

                                {/* Benefits */}
                                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                  {disposalRecommendation.benefits}
                                </p>
                              </div>
                            )}
                          </div>
                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                ⚡ Inference Time
                              </label>
                              <span className="text-lg font-bold text-slate-900">
                                {inferenceTime?.toFixed(1)} sec
                              </span>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                🕐 Timestamp
                              </label>
                              <span className="text-xs font-bold text-slate-900">
                                {formatDate(new Date().toISOString())}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Overlay */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div
            role="alert"
            aria-live="assertive"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-xl animate-fade-in-up"
          >
            <div className="px-6 py-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                  <svg
                    className="h-5 w-5 text-rose-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    Unable to Classify
                  </h3>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Close error"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                {isUnauthorizedError ? (
                  <a
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
                  >
                    Go to Login
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setError(null);
                      upload_image();
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
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
