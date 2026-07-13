"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
 
import {
  Loader2,
  AlertCircle,
  Database,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react";
import formatDate  from "@/app/utils/formatDate";

interface Dataset {
  _id: string;
  name: string;
  description: string;
  version: string;
  imageCount: number;
  filePath: string[];
  uploadDate: string;
  lastUpdated: string;
}
const Page = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/datasets`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            cache: "no-store",
          },
        );

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);

        if (!response.ok) {
          throw new Error(`Failed to fetch datasets: ${response.status}`);
        }

        // Handle different response formats
        const datasetList: Dataset[] = Array.isArray(data)
          ? data
          : data.datasets || [];
        // Sort by lastUpdated in descending order (newest first)
        const sortedDatasets = datasetList.sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime(),
        );
        console.log("Datasets to display:", sortedDatasets);
        setDatasets(sortedDatasets);
      } catch (error) {
        console.error("Error fetching datasets:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  const handleDelete = async (datasetId: string, datasetName: string) => {
    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to delete "${datasetName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(datasetId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dataset/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ dataset_id: datasetId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete dataset");
      }

      // Remove from UI
      setDatasets((prev) => prev.filter((d) => d._id !== datasetId));
      console.log("Dataset deleted successfully");
    } catch (error) {
      console.error("Error deleting dataset:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete dataset",
      );
    } finally {
      setDeleting(null);
    }
  };
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };
  return (
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 px-4 py-8 sm:p-8 animate-page-enter\">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl animate-soft-float\" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl animate-soft-float [animation-delay:1000ms]" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <Database className="w-8 h-8 text-emerald-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Uploaded Datasets
              </h1>
            </div>
            <p className="text-gray-600 sm:ml-11">
              View and manage all training datasets
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12 animate-fade-in-up">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading datasets...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold">
                  Error Loading Datasets
                </p>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && datasets.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {datasets.map((dataset: Dataset, index) => (
                <div
                  key={dataset._id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-emerald-500 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-emerald-700 transition">
                          {dataset.name}
                        </h2>
                        <p className="text-gray-600">{dataset.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center shrink-0">
                        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-semibold text-sm">
                          {dataset.imageCount} Images
                        </div>

                        <button
                          onClick={() =>
                            router.push(`/admin/datasets/update/${dataset._id}`)
                          }
                          className="flex items-center gap-2 p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Edit dataset"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(dataset._id, dataset.name)
                          }
                          disabled={deleting === dataset._id}
                          className="flex items-center gap-2 p-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition"
                          title="Delete dataset"
                        >
                          {deleting === dataset._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-linear-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
                        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                          Upload Date
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatDate(dataset.uploadDate)}
                        </p>
                      </div>
                      <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          Last Updated
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatDate(dataset.lastUpdated)}
                        </p>
                      </div>
                      <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          Version
                        </span>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {dataset.version}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && datasets.length === 0 && (
            <div className="p-12 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-xl text-center border-2 border-dashed border-emerald-300 animate-fade-in-up [animation-delay:120ms]">
              <Database className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-700 text-lg font-semibold">
                No datasets available yet.
              </p>
              <p className="text-gray-600 mt-2">
                Upload training images to get started.
              </p>
              <button
                onClick={() => router.push("/admin/datasets/upload")}
                className="mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Dataset
              </button>
            </div>
          )}
          <button
            onClick={() => router.push("/admin/datasets/upload")}
            className="mt-8 flex items-center justify-center gap-2 w-full px-6 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add New Dataset
          </button>
        </div>
      </div>
  );
};

export default Page;
