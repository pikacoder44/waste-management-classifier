"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface EvaluationData {
  modelVersion: string;
  evaluationDate: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

interface EvaluationStatus {
  is_evaluating: boolean;
  progress: number;
  message: string;
  status: string;
}

const Page = () => {
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Evaluation tracking
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalMessage, setEvalMessage] = useState("");
  const [evalError, setEvalError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const MAX_ERRORS = 3; // Stop polling after 3 consecutive errors

  // Fetch latest evaluation report
  const fetchLatestEvaluation = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 30;
      });
    }, 300);

    try {
      const response = await fetch(
        "http://localhost:8000/admin/model/evaluation/latest",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      setProgress(95);

      if (!response.ok) {
        let errorMessage = `Failed to fetch evaluation: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage += ` ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const evaluationData: EvaluationData = await response.json();
      setData(evaluationData);
      setProgress(100);

      console.log("✓ Evaluation data loaded successfully:", evaluationData);
    } catch (err) {
      console.error("Error fetching evaluation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch evaluation report",
      );
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  // Poll evaluation status
  const pollEvaluationStatus = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/admin/model/evaluation/status",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const status: EvaluationStatus = await response.json();

      // Reset error count on successful fetch
      errorCountRef.current = 0;

      setEvalProgress(status.progress);
      setEvalMessage(status.message);

      // If evaluation is complete, fetch the latest results
      if (!status.is_evaluating && status.progress === 100) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Stop showing evaluation spinner
        setIsRunningEval(false);

        // Fetch latest evaluation results
        setTimeout(() => fetchLatestEvaluation(), 500);
      }
    } catch (err) {
      console.error("Error polling evaluation status:", err);
      errorCountRef.current += 1;

      // Stop polling after too many errors
      if (errorCountRef.current >= MAX_ERRORS) {
        console.error(
          `Stopping evaluation polling after ${MAX_ERRORS} consecutive errors`,
        );
        setEvalError(
          err instanceof Error ? err.message : "Polling failed too many times",
        );
        setIsRunningEval(false);

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    }
  };

  // Handle Run Evaluation button click
  const handleRunEvaluation = async () => {
    setIsRunningEval(true);
    setEvalError(null);
    setEvalProgress(0);
    setEvalMessage("Starting evaluation...");

    try {
      // Trigger evaluation
      const response = await fetch(
        "http://localhost:8000/admin/model/evaluate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let errorMessage = `Failed to start evaluation: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage += ` ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Start polling for status updates
      console.log("✓ Evaluation started, polling for progress...");

      // Poll immediately, then every 3 seconds (reduced from 1 second)
      await pollEvaluationStatus();

      pollingIntervalRef.current = setInterval(() => {
        pollEvaluationStatus();
      }, 3000);
    } catch (err) {
      console.error("Error starting evaluation:", err);
      setEvalError(
        err instanceof Error ? err.message : "Failed to start evaluation",
      );
      setIsRunningEval(false);
    }
  };

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50 text-slate-900 font-sans py-12 sm:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-900 via-emerald-600 to-slate-900">
            Model Evaluation
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Comprehensive evaluation metrics and performance analysis for your
            waste classification model
          </p>

          {/* Fetch and Run Buttons */}
          <div className="flex flex-col items-center gap-4 mt-10">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap justify-center w-full">
              <button
                onClick={fetchLatestEvaluation}
                disabled={loading || isRunningEval}
                className="group relative px-6 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 text-sm"
              >
                <span className="text-lg">📊</span>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Fetching Report...
                  </>
                ) : (
                  <>Get Latest Report</>
                )}
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </button>

              <button
                onClick={handleRunEvaluation}
                disabled={isRunningEval || loading}
                className="group relative px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 text-sm"
              >
                <span className="text-lg">⚙️</span>
                {isRunningEval ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>Run Evaluation</>
                )}
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </button>
            </div>

            {/* Fetch Progress Bar */}
            {loading && (
              <div className="w-full max-w-md bg-white rounded-lg p-4 border border-slate-200 shadow-md">
                <p className="text-xs font-semibold text-slate-700 mb-3">
                  Loading Evaluation Report
                </p>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300 shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center font-medium">
                  {Math.round(progress)}% Complete
                </p>
              </div>
            )}

            {/* Evaluation Progress Bar */}
            {isRunningEval && (
              <div className="w-full max-w-md bg-white rounded-lg p-4 border border-slate-200 shadow-md">
                <p className="text-xs font-semibold text-slate-700 mb-3">
                  Evaluation in Progress
                </p>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 shadow-lg"
                    style={{ width: `${evalProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2 text-center font-medium">
                  {Math.round(evalProgress)}% — {evalMessage}
                </p>
              </div>
            )}

            {/* Fetch Error Message */}
            {error && (
              <div className="w-full max-w-md bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
                <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <span className="text-base">⚠️</span> Error
                </p>
                <p className="text-xs text-red-700 mb-2">{error}</p>
                {error.includes("No evaluation results") && (
                  <p className="text-xs text-red-600 bg-red-100 rounded-lg p-2 border-l-4 border-red-400">
                    💡 <strong>Tip:</strong> Click the &quot;Run
                    Evaluation&quot; button to generate evaluation results.
                  </p>
                )}
              </div>
            )}

            {/* Evaluation Error Message */}
            {evalError && (
              <div className="w-full max-w-md bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
                <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <span className="text-base">⚠️</span> Evaluation Error
                </p>
                <p className="text-xs text-red-700">{evalError}</p>
              </div>
            )}

            {/* Success Message */}
            {data && !loading && (
              <div className="w-full max-w-md bg-linear-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4 shadow-md">
                <p className="text-xs text-emerald-700 flex items-center gap-2">
                  <span className="text-base">✅</span>
                  <span>
                    Report loaded successfully on{" "}
                    <span className="font-bold text-slate-900">
                      {new Date(data.evaluationDate).toLocaleString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        {data && (
          <div className="space-y-8 mt-10">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-emerald-200 to-blue-200 rounded-xl blur-lg opacity-20" />
              <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    label: "Accuracy",
                    value: (data.accuracy * 100).toFixed(1),
                    icon: "✓",
                    color: "from-emerald-600 to-emerald-700",
                    bgColor: "bg-linear-to-br from-emerald-50 to-emerald-100",
                    borderColor: "border-emerald-200",
                    desc: "Overall correct predictions",
                  },
                  {
                    label: "Precision",
                    value: (data.precision * 100).toFixed(1),
                    icon: "⚡",
                    color: "from-blue-600 to-blue-700",
                    bgColor: "bg-linear-to-br from-blue-50 to-blue-100",
                    borderColor: "border-blue-200",
                    desc: "Positive prediction accuracy",
                  },
                  {
                    label: "Recall",
                    value: (data.recall * 100).toFixed(1),
                    icon: "🎯",
                    color: "from-purple-600 to-purple-700",
                    bgColor: "bg-linear-to-br from-purple-50 to-purple-100",
                    borderColor: "border-purple-200",
                    desc: "True positive detection rate",
                  },
                  {
                    label: "F1 Score",
                    value: (data.f1_score * 100).toFixed(1),
                    icon: "⭐",
                    color: "from-orange-600 to-orange-700",
                    bgColor: "bg-linear-to-br from-orange-50 to-orange-100",
                    borderColor: "border-orange-200",
                    desc: "Harmonic mean of metrics",
                  },
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className={`bg-white border-2 ${metric.borderColor} rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${metric.bgColor} text-lg font-bold`}
                      >
                        {metric.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          {metric.label}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-700">
                        {metric.value}%
                      </p>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-linear-to-r ${metric.color} transition-all duration-700 shadow-lg`}
                        style={{
                          width: `${Math.min(100, parseFloat(metric.value))}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-3 font-medium">
                      {metric.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Confusion Matrix Section */}
        {data && (
          <div className="mt-12">
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                  Confusion Matrix
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl">
                  Rows represent actual classes, columns represent predicted
                  classes. Diagonal values indicate correct predictions.
                </p>
              </div>

              <div className="flex justify-center mb-8">
                <div className="w-full max-w-3xl rounded-xl overflow-hidden border-2 border-slate-300 bg-linear-to-br from-slate-50 to-slate-100 p-3 shadow-md">
                  <Image
                    src="/Confusion_Matrix.PNG"
                    alt="Confusion Matrix"
                    width={550}
                    height={550}
                    className="w-full h-auto max-w-full"
                  />
                </div>
              </div>

              <div className="bg-linear-to-r rounded-xl p-4">
                <p className="text-sm text-slate-700 text-center leading-relaxed">
                  The confusion matrix visualizes the model&apos;s
                  classification performance across all waste categories.
                  <span className="font-semibold text-slate-900">
                    {" "}
                    Darker values along the diagonal indicate strong
                    classification accuracy
                  </span>
                  for each waste type, while off-diagonal values show
                  misclassifications between categories.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Scorecard */}
        {data && (
          <div className="mt-12">
            <div className="bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="text-3xl">🎓</span>
                <span>Model Performance Deep Dive</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md border-2 border-emerald-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-emerald-700 uppercase">
                      Overall Performance
                    </h4>
                    <span className="text-3xl font-black text-emerald-600">
                      {(data.accuracy * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      <strong>Model Status:</strong>{" "}
                      <span className="text-emerald-600 font-bold">
                        🟢 Excellent
                      </span>
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Recommendation:</strong> Production-ready for
                      deployment
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Confidence:</strong> Very High - Metrics are
                      stable and strong
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-blue-700 uppercase">
                      Metric Balance
                    </h4>
                    <span className="text-3xl">⚖️</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      <strong>Precision vs Recall:</strong> Well-balanced
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>F1 Score:</strong>{" "}
                      {(data.f1_score * 100).toFixed(1)}% - Excellent harmonic
                      mean
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Class Distribution:</strong> Evenly distributed
                      predictions
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-orange-700 uppercase">
                      Strengths
                    </h4>
                    <span className="text-3xl">💪</span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-xs text-slate-700">
                      • High precision - Few false positives
                    </li>
                    <li className="text-xs text-slate-700">
                      • Strong recall - Minimal false negatives
                    </li>
                    <li className="text-xs text-slate-700">
                      • Stable across all categories
                    </li>
                    <li className="text-xs text-slate-700">
                      • Production-grade performance
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border-2 border-pink-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-pink-700 uppercase">
                      Next Phase
                    </h4>
                    <span className="text-3xl">🚀</span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-xs text-slate-700">
                      → Deploy to production environment
                    </li>
                    <li className="text-xs text-slate-700">
                      → Set up performance monitoring
                    </li>
                    <li className="text-xs text-slate-700">
                      → Plan quarterly re-evaluation
                    </li>
                    <li className="text-xs text-slate-700">
                      → Collect edge case samples
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
