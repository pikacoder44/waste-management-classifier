"use client";

import React, { useState, useEffect } from "react";

interface Dataset {
  _id: string;
  name: string;
  description: string;
  version: string;
  imageCount: number;
  filePath: string[];
  label: string;
  uploadDate: string;
  lastUpdated: string;
}

// Helper function to format date as DD-MMM-YYYY
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toLowerCase();
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const Page = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch("http://localhost:8000/admin/datasets", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);

        if (!response.ok) {
          throw new Error(`Failed to fetch datasets: ${response.status}`);
        }

        // Handle different response formats
        const datasetList = Array.isArray(data) ? data : data.datasets || [];
        console.log("Datasets to display:", datasetList);
        setDatasets(datasetList);
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
        "http://localhost:8000/admin/dataset/delete",
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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Uploaded Datasets
          </h1>
          <p className="text-gray-400">View and manage all training datasets</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
            <p className="text-gray-400 mt-4">Loading datasets...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-900 border-l-4 border-red-500 rounded-lg mb-6">
            <p className="text-red-100 font-semibold">⚠️ Error</p>
            <p className="text-red-200 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && datasets.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {datasets.map((dataset: Dataset) => (
              <div
                key={dataset._id}
                className="group p-6 bg-linear-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg hover:shadow-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 border-l-4 border-orange-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-orange-700 transition">
                      {dataset.name}
                    </h2>
                    <p className="text-gray-700">{dataset.description}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
                      {dataset.imageCount} Images
                    </div>
                    <button
                      onClick={() => handleDelete(dataset._id, dataset.name)}
                      disabled={deleting === dataset._id}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                      title="Delete this dataset"
                    >
                      {deleting === dataset._id ? (
                        <span>⏳</span>
                      ) : (
                        <span>🗑️</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-orange-300">
                  <div className="bg-white bg-opacity-70 p-4 rounded-lg hover:bg-opacity-100 transition">
                    <span className="text-sm font-semibold text-orange-600">
                      Upload Date
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {formatDate(dataset.uploadDate)}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-70 p-4 rounded-lg hover:bg-opacity-100 transition">
                    <span className="text-sm font-semibold text-orange-600">
                      Last Updated
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {formatDate(dataset.lastUpdated)}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-70 p-4 rounded-lg hover:bg-opacity-100 transition">
                    <span className="text-sm font-semibold text-orange-600">
                      Label
                    </span>
                    <p className="text-lg font-bold text-gray-900 capitalize">
                      {dataset.label}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-70 p-4 rounded-lg hover:bg-opacity-100 transition">
                    <span className="text-sm font-semibold text-orange-600">
                      Version
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {dataset.version}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && datasets.length === 0 && (
          <div className="p-12 bg-linear-to-br from-orange-50 to-orange-100 rounded-xl text-center border-2 border-dashed border-orange-300">
            <p className="text-gray-700 text-lg font-semibold">
              No datasets available yet.
            </p>
            <p className="text-gray-600 mt-2">
              Upload training images to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
