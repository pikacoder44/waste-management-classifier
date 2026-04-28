"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Loader from "../components/Loader";
interface HistoryItem {
  _id: string;
  userId: string;
  filePath: string;
  createdAt: string;
  predictedLabel: string;
  confidence: number;
  inferenceTime: number;
  disposalRecommendation: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          "http://localhost:8000/classification/history",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );

        if (response.status === 401) {
          router.push("/auth/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError(err instanceof Error ? err.message : "Error fetching history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [router]);

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      setDeletingId(entryId);

      const response = await fetch(
        `http://localhost:8000/classification/history/${entryId}`,
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

  const getCategoryColor = (label: string) => {
    const colors: Record<string, string> = {
      plastic: "bg-blue-100 text-blue-800 border-blue-300",
      glass: "bg-cyan-100 text-cyan-800 border-cyan-300",
      metal: "bg-gray-100 text-gray-800 border-gray-300",
      paper: "bg-amber-100 text-amber-800 border-amber-300",
      cardboard: "bg-yellow-100 text-yellow-800 border-yellow-300",
      trash: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      colors[label.toLowerCase()] ||
      "bg-slate-100 text-slate-800 border-slate-300"
    );
  };

  const getCategoryIcon = (label: string) => {
    const icons: Record<string, string> = {
      plastic: "🔵",
      glass: "🟦",
      metal: "⚙️",
      paper: "📄",
      cardboard: "📦",
      trash: "🗑️",
    };
    return icons[label.toLowerCase()] || "🔍";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-emerald-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Classification History
              </h1>
              <p className="text-slate-600">
                View all your waste classification records
              </p>
            </div>
            <Link
              href="/"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-300"
            >
              New Classification
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
            <p className="text-red-700 font-semibold">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              No History Yet
            </h2>
            <p className="text-slate-600 mb-6">
              You haven&apos;t classified any waste items yet. Start by
              uploading an image.
            </p>
            <Link
              href="/"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300"
            >
              Classify Now
            </Link>
          </div>
        )}

        {/* History Grid */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Image Preview */}
                <div className="relative h-48 bg-slate-200 overflow-hidden">
                  <Image
                    src={`http://localhost:8000/${item.filePath.replace(/\\/g, "/").replace(/^backend\//, "")}`}
                    alt={item.predictedLabel}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                    unoptimized
                  />
                </div>

                {/* Header with Category Badge */}
                <div className="bg-linear-to-r from-emerald-400 to-emerald-600 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {getCategoryIcon(item.predictedLabel)}
                    </span>
                    <div>
                      <p className="text-white text-xs opacity-90">
                        Classification
                      </p>
                      <p className="text-white font-bold text-lg capitalize">
                        {item.predictedLabel}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full border-2 text-xs font-bold capitalize ${getCategoryColor(item.predictedLabel)}`}
                  >
                    {item.predictedLabel}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Confidence Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-700 font-semibold text-sm">
                        Confidence
                      </p>
                      <p className="text-emerald-600 font-bold">
                        {(item.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Inference Time */}
                  <div className="mb-4">
                    <p className="text-slate-600 text-sm">
                      <span className="font-semibold">Inference Time:</span>{" "}
                      {item.inferenceTime.toFixed(3)}s
                    </p>
                  </div>

                  {/* Disposal Recommendation */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-900 text-sm">
                      <span className="font-semibold">💡 Recommendation:</span>
                    </p>
                    <p className="text-blue-800 text-sm mt-1">
                      {item.disposalRecommendation}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <p className="text-slate-500 text-xs mb-4">
                    📅 {formatDate(item.createdAt)}
                  </p>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId === item._id}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-lg transition-all duration-300 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === item._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {history.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-4xl font-bold text-emerald-600 mb-2">
                {history.length}
              </p>
              <p className="text-slate-600">Total Classifications</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-4xl font-bold text-emerald-600 mb-2">
                {(
                  history.reduce((sum, item) => sum + item.confidence, 0) /
                  history.length
                ).toFixed(1)}
                %
              </p>
              <p className="text-slate-600">Average Confidence</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <p className="text-4xl font-bold text-emerald-600 mb-2">
                {(
                  history.reduce((sum, item) => sum + item.inferenceTime, 0) /
                  history.length
                ).toFixed(3)}
                s
              </p>
              <p className="text-slate-600">Average Inference Time</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
