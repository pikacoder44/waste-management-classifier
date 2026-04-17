"use client";

import React, { useState, useEffect, useRef } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(
    null,
  );
  const [showAcknowledgement, setShowAcknowledgement] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const errorCountRef = useRef(0);
  const MAX_ERRORS = 3; // Stop polling after 3 consecutive errors

  // Fetch training status from the API
  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/model/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data: TrainingStatus = await response.json();
        setTrainingStatus(data);

        // Reset error count on successful fetch
        errorCountRef.current = 0;

        // Show completion animation when training is done
        if (data.status === "completed" && data.progress === 100) {
          setShowCompletion(true);
          // Stop polling
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      } else {
        throw new Error(`Status fetch failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching training status:", error);
      errorCountRef.current += 1;

      // Stop polling after too many errors
      if (errorCountRef.current >= MAX_ERRORS) {
        console.error(
          `Stopping training polling after ${MAX_ERRORS} consecutive errors`,
        );
        alert(
          "Training monitoring stopped due to connection errors. Check your connection and try again.",
        );

        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    }
  };

  // Start model retraining
  const handleRetrain = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/admin/model/retrain",
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
        // Fetch initial status
        setTimeout(() => {
          fetchTrainingStatus();
        }, 500);

        // Start polling for status updates every 3 seconds (reduced from 2 seconds)
        const interval = setInterval(() => {
          fetchTrainingStatus();
        }, 3000);
        setPollingInterval(interval);
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

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Model Retraining
          </h1>
          <p className="text-slate-300">
            Retrain the waste classification model with your dataset
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          {!showAcknowledgement ? (
            // Initial State - Button
            <div className="text-center py-12">
              <div className="mb-8">
                <svg
                  className="w-24 h-24 mx-auto text-blue-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Ready to Retrain?
              </h2>
              <p className="text-slate-300 mb-8 max-w-md mx-auto">
                This process will combine your original and custom datasets,
                then retrain the model. This may take several minutes.
              </p>
              <button
                onClick={handleRetrain}
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Starting...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    Start Retraining
                  </>
                )}
              </button>
            </div>
          ) : (
            // Training In Progress - Status & Progress Bar
            <div className="space-y-8">
              {/* Acknowledgement Banner */}
              {!showCompletion && (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-200 flex items-center gap-2">
                    <span className="animate-pulse">✓</span>
                    Training started successfully! Please wait while we retrain
                    your model.
                  </p>
                </div>
              )}

              {/* Status Information */}
              {trainingStatus && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 rounded p-4">
                    <p className="text-slate-400 text-sm">Status</p>
                    <p className="text-white font-semibold capitalize">
                      {trainingStatus.status}
                    </p>
                  </div>
                  {trainingStatus.total_epochs > 0 && (
                    <div className="bg-slate-700/50 rounded p-4">
                      <p className="text-slate-400 text-sm">Epoch Progress</p>
                      <p className="text-white font-semibold">
                        {trainingStatus.epoch} / {trainingStatus.total_epochs}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-slate-300 font-medium">
                    Overall Progress
                  </label>
                  <span className="text-blue-400 font-bold">
                    {trainingStatus?.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-linear-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${trainingStatus?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Status Message */}
              {trainingStatus && (
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-300">
                    <span className="text-cyan-400 font-semibold">
                      Current Task:
                    </span>{" "}
                    {trainingStatus.message}
                  </p>
                </div>
              )}

              {/* Completion Animation */}
              {showCompletion && trainingStatus?.status === "completed" && (
                <div className="mt-8">
                  <div className="text-center">
                    {/* Celebration Animation */}
                    <div className="mb-6">
                      {/* Checkmark Animation */}
                      <div className="flex justify-center">
                        <svg
                          className="w-24 h-24 text-green-400 animate-bounce"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>

                      {/* Confetti Effect */}
                      <div className="mt-6 flex justify-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                            style={{
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-green-400 mb-2">
                      Training Complete! 🎉
                    </h3>
                    <p className="text-slate-300 mb-6">
                      Your model has been successfully retrained and saved.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => {
                          setShowAcknowledgement(false);
                          setShowCompletion(false);
                          setTrainingStatus(null);
                        }}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Retrain Again
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = "/admin/evaluation")
                        }
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                      >
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
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            What happens during retraining?
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex gap-3">
              <span className="text-blue-400">▸</span>
              <span>
                Datasets from{" "}
                <code className="text-cyan-300">dataset/original</code> and{" "}
                <code className="text-cyan-300">dataset/custom</code> are
                combined
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">▸</span>
              <span>Data is split into 80% training and 20% testing sets</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">▸</span>
              <span>
                MobileNetV2 model is trained for up to 20 epochs with early
                stopping
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">▸</span>
              <span>
                Updated model is saved to{" "}
                <code className="text-cyan-300">
                  model/waste_classifier_model.keras
                </code>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
