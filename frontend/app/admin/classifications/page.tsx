"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface ClassificationEntry {
  _id: string;
  userId?: string;
  predictedLabel: string;
  confidence: number;
  filePath: string;
  createdAt: string;
  disposalRecommendation?: string;
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
      const response = await fetch(filePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${wasteType}-${new Date().getTime()}.jpg`;
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/classification/history/${entryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      setHistory(history.filter((item) => item._id !== entryId));
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert("Failed to delete entry");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    // Fetch classification history from the backend
    const fetchClassificationHistory = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/admin/classification/history",
          {
            credentials: "include", // Send cookies with request
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">
          Loading classification history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-700 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No classifications found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classificationHistory.map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full"
              >
                {/* Image */}
                <div className="relative w-full bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden aspect-square group">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${entry.filePath.replace(/\\/g, "/").replace(/^backend\//, "")}`}
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

                {/* Content */}
                <div className="p-5 grow flex flex-col">
                  {/* Waste Type Badge */}
                  <div className="mb-4 flex justify-center">
                    <span className="text-lg font-semibold text-gray-700 capitalize flex flex-col justify-center text-center tracking-wide">
                      Predicted Label:
                    </span>
                    <span className="text-emerald-600 ml-2 text-2xl font-bold tracking-tight">
                      {entry.predictedLabel.charAt(0).toUpperCase() +
                        entry.predictedLabel.slice(1)}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Confidence Score
                      </p>
                      <span className="text-lg font-bold text-emerald-600">
                        {(entry.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-linear-to-r from-emerald-400 via-emerald-500 to-teal-500 h-3 rounded-full shadow-lg"
                        style={{
                          width: `${Math.min(100, entry.confidence * 100)}%`,
                          transition: "width 0.5s ease-out",
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="border-t border-gray-100 pt-4 mt-auto">
                    <div className="bg-linear-to-b from-gray-50 to-gray-100 -mx-5 -mb-5 -ml-5 -mr-5 px-5 py-3 rounded-b-xl space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                          User ID
                        </p>
                        <p className="text-xs font-mono text-gray-700 truncate mt-1 bg-white px-2.5 py-1.5 rounded border border-gray-100/50">
                          {entry.userId || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                          Date
                        </p>
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </p>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(entry._id)}
                          disabled={deletingId === entry._id}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-lg transition-all duration-300 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === entry._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
