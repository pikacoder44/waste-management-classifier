"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ProtectedAdminRoute } from "@/app/components/ProtectedAdminRoute";
import { getCategoryIcon, getCategoryColor, getCategoryHeaderGradient, getConfidenceBarColor, getCategoryCardGradient } from "@/app/components/CategoryComponents";
import { formatDate } from "@/app/utils/dateUtils";
interface ClassificationEntry {
  _id: string;
  userId: string;
  filePath: string;
  createdAt: string;
  predictedLabel: string;
  confidence: number;
  inferenceTime: number;
  disposalRecommendation:
    | string
    | {
        disposal_method?: string;
        description?: string;
        benefits?: string;
        alternatives?: string[];
      };
}

const Page = () => {
  const [classificationHistory, setClassificationHistory] = useState<
    ClassificationEntry[]
  >([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadImage = async (filePath: string, wasteType: string) => {
    try {
      setDownloadingId(wasteType);
      // Construct full URL like the Image component does
      const fullUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/${filePath.replace(/\\/g, "/").replace(/^backend\//, "")}`;
      const cacheBustedUrl = `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}download=${Date.now()}`;
      const response = await fetch(cacheBustedUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${wasteType}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download image");
    } finally {
      setDownloadingId(null);
    }
  };
  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      setDeletingId(entryId);

      // Use /admin/classification/history endpoint which doesn't check user ownership
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/classification/history/${entryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        let errorMessage = "Failed to delete entry";

        if (response.status === 404) {
          errorMessage = "Entry not found";
        } else if (response.status === 400) {
          errorMessage = "Invalid entry ID format";
        } else if (response.status === 403) {
          errorMessage = "Not authorized to delete this entry";
        } else if (response.status === 503) {
          errorMessage = "Database unavailable - please try again";
        } else if (response.status === 500) {
          const data = await response.json().catch(() => ({}));
          errorMessage = data.detail || "Server error occurred";
        }

        throw new Error(errorMessage);
      }

      setClassificationHistory(
        classificationHistory.filter((item) => item._id !== entryId),
      );
      alert("Entry deleted successfully");
    } catch (err) {
      console.error("Error deleting entry:", err);
      const message =
        err instanceof Error ? err.message : "Failed to delete entry";
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    // Fetch classification history from the backend
    const fetchClassificationHistory = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/classification/history`,
          {
            credentials: "include", // Send cookies with request
          },
        );

        if (!response.ok) {
          const errorMessage =
            response.status === 503
              ? "Database connection unavailable"
              : `Failed to fetch history: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const data: { status: string; history: ClassificationEntry[] } =
          await response.json();
        setClassificationHistory(data.history || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load classification history",
        );
        setClassificationHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassificationHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-page-enter">
        <div className="text-lg text-gray-600 animate-fade-in-up">
          Loading classification history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-page-enter">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md animate-fade-in-up">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-700 text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedAdminRoute>
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 animate-page-enter\">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl animate-soft-float\" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl animate-soft-float [animation-delay:1000ms]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-5xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Classifications
              </h1>
            </div>
            <p className="text-gray-500 text-lg">
              Viewing{" "}
              <span className="font-semibold text-gray-700">
                {classificationHistory.length}
              </span>{" "}
              waste classification
              {classificationHistory.length !== 1 ? "s" : ""}
            </p>
          </div>

          {classificationHistory.length === 0 ? (
            <div className="text-center py-12 animate-fade-in-up [animation-delay:120ms]">
              <p className="text-gray-500 text-lg">No classifications found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {classificationHistory.map((entry, index) => (
                <div
                  key={entry._id}
                  className={`${getCategoryCardGradient(entry.predictedLabel)} rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full group animate-fade-in-up`}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-200 overflow-hidden group">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${entry.filePath.replace(/\\\\/g, "/").replace(/^backend\\/, "")}`}
                      alt={entry.predictedLabel}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      unoptimized
                    />
                    {/* Download Button Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() =>
                          handleDownloadImage(
                            entry.filePath,
                            entry.predictedLabel,
                          )
                        }
                        disabled={downloadingId === entry.predictedLabel}
                        className="bg-white hover:bg-emerald-500 disabled:bg-gray-300 text-gray-700 hover:text-white disabled:text-gray-500 p-3 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-110 disabled:scale-100 disabled:shadow-none hover:-translate-y-1 flex items-center justify-center backdrop-blur-sm hover:backdrop-blur-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-500 ${downloadingId === entry.predictedLabel ? "animate-bounce" : ""}`}
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Header with Category Badge */}
                  <div
                    className={`${getCategoryHeaderGradient(entry.predictedLabel)} p-4 flex items-center justify-between text-white`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getCategoryColor(entry.predictedLabel).split(" ")[0]}`}
                      >
                        {getCategoryIcon(entry.predictedLabel)}
                      </div>
                      <div>
                        <p className="text-white text-xs opacity-90">
                          Preicted Category
                        </p>
                        <p className="text-white font-bold text-lg capitalize">
                          {entry.predictedLabel}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full border-2 text-xs font-bold capitalize bg-white ${getCategoryColor(entry.predictedLabel).split(" ").slice(1).join(" ")}`}
                    >
                      {entry.predictedLabel}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 grow flex flex-col">
                    {/* Confidence */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Confidence Score
                        </p>
                        <span
                          className={`text-lg font-bold ${getCategoryColor(entry.predictedLabel).split(" ")[1]}`}
                        >
                          {(entry.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-3 rounded-full shadow-lg ${getConfidenceBarColor(entry.predictedLabel)}`}
                          style={{
                            width: `${Math.min(100, entry.confidence * 100)}%`,
                            transition: "width 0.5s ease-out",
                          }}
                        />
                      </div>
                    </div>

                    {/* Disposal Recommendation */}
                    {entry.disposalRecommendation && (
                      <div
                        className={`mb-4 p-4 rounded-lg border ${
                          entry.predictedLabel === "cardboard"
                            ? "bg-amber-50 border-amber-200"
                            : entry.predictedLabel === "glass"
                              ? "bg-blue-50 border-blue-200"
                              : entry.predictedLabel === "metal"
                                ? "bg-gray-50 border-gray-200"
                                : entry.predictedLabel === "paper"
                                  ? "bg-yellow-50 border-yellow-200"
                                  : entry.predictedLabel === "plastic"
                                    ? "bg-purple-50 border-purple-200"
                                    : entry.predictedLabel === "trash"
                                      ? "bg-red-50 border-red-200"
                                      : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {typeof entry.disposalRecommendation === "object" ? (
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold text-sm mb-1">
                                ♻️ Disposal Method
                              </p>
                              <p className="text-sm font-bold text-emerald-700">
                                {entry.disposalRecommendation.disposal_method}
                              </p>
                            </div>
                            <div className="border-t pt-2">
                              <p className="font-semibold text-xs mb-1 opacity-75">
                                📝 Instructions
                              </p>
                              <p className="text-sm">
                                {entry.disposalRecommendation.description}
                              </p>
                            </div>
                            <div className="border-t pt-2">
                              <p className="font-semibold text-xs mb-1 opacity-75">
                                🌱 Environmental Benefits
                              </p>
                              <p className="text-sm">
                                {entry.disposalRecommendation.benefits}
                              </p>
                            </div>
                            {entry.disposalRecommendation.alternatives &&
                              entry.disposalRecommendation.alternatives.length >
                                0 && (
                                <div className="border-t pt-2">
                                  <p className="font-semibold text-xs mb-1 opacity-75">
                                    🔄 Alternatives
                                  </p>
                                  <ul className="text-sm space-y-1">
                                    {entry.disposalRecommendation.alternatives.map(
                                      (alt: string, idx: number) => (
                                        <li
                                          key={idx}
                                          className="flex items-start gap-2"
                                        >
                                          <span className="text-emerald-600 font-bold">
                                            •
                                          </span>
                                          <span>{alt}</span>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-sm">
                              💡 Recommendation:
                            </p>
                            <p className="text-sm mt-1">
                              {entry.disposalRecommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inference Time */}
                    <div className="mb-4 p-3 rounded-lg bg-slate-100">
                      <p className="text-sm font-semibold text-slate-700">
                        ⚡ Inference Time:{" "}
                        <span className="text-slate-900">
                          {entry.inferenceTime.toFixed(3)}s
                        </span>
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="border-t border-gray-200 pt-4 mt-auto">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                            User ID
                          </p>
                          <p className="text-xs font-mono text-gray-700 truncate mt-1 bg-gray-100 px-2.5 py-1.5 rounded border border-gray-200">
                            {entry.userId || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                            Date
                          </p>
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(entry._id)}
                          disabled={deletingId === entry._id}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-lg transition-all duration-300 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                          {deletingId === entry._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default Page;
