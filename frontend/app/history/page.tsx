"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Loader from "../components/Loader";
import {
  Package,
  BottleWine,
  Hammer,
  FileText,
  Recycle,
  Trash2,
  HelpCircle,
} from "lucide-react";

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

  const handleRetry = () => {
    window.location.reload();
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/classification/history`,
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

  const getCategoryColor = (label: string) => {
    const colors: Record<string, string> = {
      plastic: "bg-purple-200 text-purple-900 border-purple-300",
      glass: "bg-blue-200 text-blue-900 border-blue-300",
      metal: "bg-gray-300 text-gray-900 border-gray-400",
      paper: "bg-yellow-200 text-yellow-900 border-yellow-300",
      cardboard: "bg-amber-200 text-amber-900 border-amber-300",
      trash: "bg-red-200 text-red-900 border-red-300",
    };
    return (
      colors[label.toLowerCase()] || "bg-gray-300 text-gray-900 border-gray-400"
    );
  };

  const getCategoryHeaderGradient = (label: string) => {
    const gradients: Record<string, string> = {
      plastic: "bg-linear-to-r from-purple-500 to-purple-700",
      glass: "bg-linear-to-r from-blue-500 to-blue-700",
      metal: "bg-linear-to-r from-gray-500 to-gray-700",
      paper: "bg-linear-to-r from-yellow-500 to-yellow-700",
      cardboard: "bg-linear-to-r from-amber-500 to-amber-700",
      trash: "bg-linear-to-r from-red-500 to-red-700",
    };
    return (
      gradients[label.toLowerCase()] ||
      "bg-linear-to-r from-gray-500 to-gray-700"
    );
  };

  const getCategoryCardGradient = (label: string) => {
    const gradients: Record<string, string> = {
      cardboard: "bg-linear-to-br from-amber-100 via-amber-50 to-white",
      glass: "bg-linear-to-br from-blue-100 via-blue-50 to-white",
      metal: "bg-linear-to-br from-gray-200 via-gray-100 to-white",
      paper: "bg-linear-to-br from-yellow-100 via-yellow-50 to-white",
      plastic: "bg-linear-to-br from-purple-100 via-purple-50 to-white",
      trash: "bg-linear-to-br from-red-100 via-red-50 to-white",
    };
    return gradients[label.toLowerCase()] || "bg-gray-50";
  };

  const getCategoryIcon = (label: string) => {
    const icons: Record<string, React.ReactNode> = {
      cardboard: <Package className="w-8 h-8 text-amber-700" />,
      glass: <BottleWine className="w-8 h-8 text-blue-700" />,
      metal: <Hammer className="w-8 h-8 text-gray-700" />,
      paper: <FileText className="w-8 h-8 text-yellow-700" />,
      plastic: <Recycle className="w-8 h-8 text-purple-700" />,
      trash: <Trash2 className="w-8 h-8 text-red-700" />,
    };
    return (
      icons[label.toLowerCase()] || (
        <HelpCircle className="w-8 h-8 text-gray-700" />
      )
    );
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
            <button
              onClick={handleRetry}
              className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
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
                className={`${getCategoryCardGradient(item.predictedLabel)} rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                {/* Image Preview */}
                <div className="relative h-48 bg-slate-200 overflow-hidden">
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${item.filePath.replace(/\\\\/g, "/").replace(/^backend\\/, "")}`}
                    alt={item.predictedLabel}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                    unoptimized
                  />
                </div>

                {/* Header with Category Badge */}
                <div
                  className={`${getCategoryHeaderGradient(item.predictedLabel)} p-4 flex items-center justify-between text-black `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${getCategoryColor(item.predictedLabel).split(" ")[0]}`}
                    >
                      {getCategoryIcon(item.predictedLabel)}
                    </div>
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
                    className={`px-3 py-1 rounded-full border-2 text-xs font-bold capitalize bg-white text-current ${getCategoryColor(item.predictedLabel).split(" ").slice(1).join(" ")}`}
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
                      <p
                        className={`font-bold ${getCategoryColor(item.predictedLabel).split(" ")[1]}`}
                      >
                        {(item.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.predictedLabel === "cardboard"
                            ? "bg-amber-600"
                            : item.predictedLabel === "glass"
                              ? "bg-blue-600"
                              : item.predictedLabel === "metal"
                                ? "bg-gray-600"
                                : item.predictedLabel === "paper"
                                  ? "bg-yellow-600"
                                  : item.predictedLabel === "plastic"
                                    ? "bg-purple-600"
                                    : item.predictedLabel === "trash"
                                      ? "bg-red-600"
                                      : "bg-gray-600"
                        }`}
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
                  <div className="mb-4 p-4 rounded-lg bg-white/60 backdrop-blur-sm space-y-2">
                    {typeof item.disposalRecommendation === "object" ? (
                      <div>
                        {/* Disposal Method */}
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Disposal Method:
                          </span>{" "}
                          <span className="font-semibold text-slate-900">
                            {item.disposalRecommendation.disposal_method}
                          </span>
                        </p>

                        {/* Recommendation */}
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-slate-700">
                            Recommendation
                          </p>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            {item.disposalRecommendation.description}
                          </p>
                        </div>

                        {/* Benefits */}
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          {item.disposalRecommendation.benefits}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.disposalRecommendation}
                      </p>
                    )}
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
      </div>
    </main>
  );
}
