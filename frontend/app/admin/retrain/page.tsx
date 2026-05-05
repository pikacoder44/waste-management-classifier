"use client";

import { useState, useEffect, useRef } from "react";
import { ProtectedAdminRoute } from "@/app/components/ProtectedAdminRoute";
import { Loader2, Zap, CheckCircle, RotateCcw, BookOpen } from "lucide-react";

interface TrainingStatus {
  is_training: boolean;
  progress: number;
  status: string;
  message: string;
  started_at: string | null;
  epoch: number;
  total_epochs: number;
}

export default function RetrainPage() {
  const DEFAULT_MAX_EPOCHS = 20;
  const [isLoading, setIsLoading] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(
    null,
  );
  const [showAcknowledgement, setShowAcknowledgement] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const errorCountRef = useRef(0);
  const MAX_ERRORS = 3; // Stop polling after 3 consecutive errors

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = () => {
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchTrainingStatus();
      }, 3000);
    }
  };

  // Fetch training status from the API
  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/model/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        const data: TrainingStatus = await response.json();
        setTrainingStatus(data);

        // Keep page state aligned with backend training lifecycle
        const shouldShowTrainingPanel =
          data.is_training || data.status === "completed";
        setShowAcknowledgement(shouldShowTrainingPanel);

        if (data.is_training) {
          setShowCompletion(false);
          if (!pollingRef.current) {
            startPolling();
          }
        } else {
          stopPolling();
        }

        // Reset error count on successful fetch
        errorCountRef.current = 0;

        // Show completion animation when training is done
        if (!data.is_training && data.status === "completed") {
          setShowCompletion(true);
        }
      } else {
        throw new Error(`Status fetch failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching training status:", error);
      errorCountRef.current += 1;

      // Stop polling after too many errors
      if (errorCountRef.current >= MAX_ERRORS) {
        const wasTraining = trainingStatus?.is_training;
        stopPolling();

        if (wasTraining) {
          alert(
            "Training monitoring stopped due to connection issues while training was in progress.",
          );
        } else {
          console.warn("Backend unreachable. Stopped polling silently.");
        }
      }
    }
  };

  // Start model retraining
  const handleRetrain = async () => {
    // Guard against duplicate retrain requests while already training
    if (trainingStatus?.is_training || pollingRef.current) {
      return;
    }

    setIsLoading(true);
    // Reset error counter when starting a new retrain
    errorCountRef.current = 0;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/model/retrain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        setShowAcknowledgement(true);
        setShowCompletion(false);
        startPolling();
        // Fetch initial status
        setTimeout(() => {
          fetchTrainingStatus();
        }, 500);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || "Failed to start training"}`);
      }
    } catch (error) {
      console.error("Error starting training:", error);
      alert("Failed to start training");
    } finally {
      setIsLoading(false);
    }
  };

  // Check current training status on mount
  useEffect(() => {
    // Check current training status once when the page mounts
    fetchTrainingStatus();

    return () => {
      stopPolling();
    };
    // Intentionally run once on mount to restore current training state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProtectedAdminRoute>
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-50 via-gray-75 to-gray-100 px-4 py-8 sm:p-8 animate-page-enter">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl animate-soft-float" />
        <div className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl animate-soft-float [animation-delay:1000ms]" />
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="mb-12 pb-8 border-b border-gray-200 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Model Retraining
            </h1>
            <p className="text-gray-600">
              Retrain your waste classifier model to improve accuracy with your
              datasets
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10 border border-gray-200 animate-fade-in-up [animation-delay:120ms]">
            {!showAcknowledgement ? (
              // Initial State - Button
              <div className="py-12 sm:py-16 px-4">
                <div className="text-center mb-12 animate-fade-in-up">
                  <div className="inline-flex p-6 bg-linear-to-br from-emerald-100 to-emerald-50 rounded-full mb-6 shadow-lg">
                    <Zap className="w-16 h-16 text-emerald-600" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    Ready to Retrain?
                  </h2>
                  <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
                    Start the retraining process to combine your datasets and
                    enhance the model&apos;s accuracy
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in-up [animation-delay:120ms]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      70:30
                    </div>
                    <div className="text-sm text-gray-600">Split Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {trainingStatus?.total_epochs || DEFAULT_MAX_EPOCHS}
                    </div>
                    <div className="text-sm text-gray-600">Max Epochs</div>
                  </div>
                  <div className="text-center col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="text-2xl font-bold text-purple-600">
                      MobileNetV2
                    </div>
                    <div className="text-sm text-gray-600">Architecture</div>
                  </div>
                </div>

                <button
                  onClick={handleRetrain}
                  disabled={isLoading}
                  className="relative px-10 py-4 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl hover:shadow-emerald-500/40 transform hover:scale-105 active:scale-95 animate-soft-float"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-lg">Starting Training...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6" />
                      <span className="text-lg">Start Retraining</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Training In Progress - Status & Progress Bar
              <div className="space-y-8">
                {/* Acknowledgement Banner */}
                {!showCompletion && (
                  <div className="bg-linear-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 rounded-lg p-5 flex items-start gap-4 shadow-sm animate-fade-in-up">
                    <CheckCircle className="w-6 h-6 text-emerald-600 animate-pulse shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-900 font-bold">
                        Training in progress!
                      </p>
                      <p className="text-emerald-800 mt-1">
                        Please wait while we retrain your model. This may take
                        several minutes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                {trainingStatus && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-linear-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition animate-fade-in-up">
                      <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-2">
                        Training Status
                      </p>
                      <p className="text-gray-900 font-bold text-lg capitalize">
                        {trainingStatus.status}
                      </p>
                    </div>
                    {trainingStatus.total_epochs > 0 && (
                      <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition animate-fade-in-up [animation-delay:100ms]">
                        <p className="text-blue-700 text-xs font-bold uppercase tracking-widest mb-2">
                          Epoch Progress
                        </p>
                        <p className="text-gray-900 font-bold text-lg">
                          {trainingStatus.epoch} / {trainingStatus.total_epochs}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 animate-fade-in-up [animation-delay:180ms]">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-gray-900 font-bold text-lg">
                      Overall Progress
                    </label>
                    <span className="text-emerald-600 font-bold text-2xl">
                      {trainingStatus?.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-5 overflow-hidden shadow-inner">
                    <div
                      className="bg-linear-to-r from-emerald-500 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-700 ease-out shadow-lg"
                      style={{ width: `${trainingStatus?.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                {trainingStatus && (
                  <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 shadow-sm animate-fade-in-up [animation-delay:100ms]">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                        <BookOpen className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-emerald-900 font-bold text-sm uppercase tracking-wide mb-1">
                          Current Task
                        </p>
                        <p className="text-emerald-800 font-medium">
                          {trainingStatus.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Completion Animation */}
                {showCompletion && trainingStatus?.status === "completed" && (
                  <div className="mt-8 bg-linear-to-br from-emerald-50 via-emerald-100 to-teal-50 rounded-2xl p-12 border-2 border-emerald-300 shadow-xl animate-fade-in-up">
                    <div className="text-center">
                      {/* Celebration Animation */}
                      <div className="mb-8">
                        {/* Checkmark Animation */}
                        <div className="flex justify-center mb-6">
                          <div className="relative">
                            <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl animate-pulse"></div>
                            <CheckCircle className="relative w-28 h-28 text-emerald-500 animate-bounce" />
                          </div>
                        </div>

                        {/* Confetti Effect */}
                        <div className="flex justify-center gap-3">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-lg"
                              style={{
                                animationDelay: `${i * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <h3 className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                        Training Complete! 🎉
                      </h3>
                      <p className="text-gray-700 text-lg mb-8 max-w-lg mx-auto">
                        Your waste classifier model has been successfully
                        retrained with improved accuracy.
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                        <button
                          onClick={() => {
                            setShowAcknowledgement(false);
                            setShowCompletion(false);
                            setTrainingStatus(null);
                          }}
                          className="flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95"
                        >
                          <RotateCcw className="w-5 h-5" />
                          Retrain Again
                        </button>
                        <button
                          onClick={() =>
                            (window.location.href = "/admin/evaluation")
                          }
                          className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                        >
                          <BookOpen className="w-5 h-5" />
                          View Evaluation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-10 bg-linear-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 shadow-lg animate-fade-in-up [animation-delay:200ms]">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-700" />
              </div>
              What happens during retraining?
            </h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex gap-4">
                <span className="text-blue-600 font-bold text-2xl shrink-0">
                  ▸
                </span>
                <span className="font-medium">
                  Datasets from{" "}
                  <code className="bg-white px-3 py-1 rounded-lg text-blue-700 font-mono text-sm font-bold shadow-sm">
                    dataset/original
                  </code>{" "}
                  and{" "}
                  <code className="bg-white px-3 py-1 rounded-lg text-blue-700 font-mono text-sm font-bold shadow-sm">
                    dataset/custom
                  </code>{" "}
                  are combined
                </span>
              </li>
              <li className="flex gap-4">
                <span className="text-blue-600 font-bold text-2xl shrink-0">
                  ▸
                </span>
                <span className="font-medium">
                  Data is split into 70% training and 30% testing sets
                </span>
              </li>
              <li className="flex gap-4">
                <span className="text-blue-600 font-bold text-2xl shrink-0">
                  ▸
                </span>
                <span className="font-medium">
                  MobileNetV2 model is trained for up to 20 epochs with early
                  stopping
                </span>
              </li>
              <li className="flex gap-4">
                <span className="text-blue-600 font-bold text-2xl shrink-0">
                  ▸
                </span>
                <span className="font-medium">
                  Updated model is saved to{" "}
                  <code className="bg-white px-3 py-1 rounded-lg text-blue-700 font-mono text-sm font-bold shadow-sm">
                    model/waste_classifier_model.keras
                  </code>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
}
