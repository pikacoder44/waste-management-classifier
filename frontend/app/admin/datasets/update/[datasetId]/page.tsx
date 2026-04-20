"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FileItem {
  filePath: string;
  label: string;
  originalFilename: string;
}
interface Record {
  dataset_id: string;
  new_name?: string;
  description?: string;
  version?: string;
  images?: { filename: string; label: string; fileData: string }[];
}

const ALLOWED_LABELS = [
  "cardboard",
  "paper",
  "metal",
  "glass",
  "plastic",
  "trash",
];

const Page = ({ params }: { params: Promise<{ datasetId: string }> }) => {
  const { datasetId } = React.use(params);
  const router = useRouter();
  const [datasetName, setDatasetName] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [datasetVersion, setDatasetVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState("");
  const [filePaths, setFilePaths] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<
    { file: File; label: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [originalName, setOriginalName] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Utility function for API calls
  const apiCall = async (
    endpoint: string,
    method: string,
    body?: Record<string, Record<string, unknown>>,
  ) => {
    const fetchOptions: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    };

    // Only add body for POST, PUT, PATCH requests
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(
      `http://localhost:8000${endpoint}`,
      fetchOptions,
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }

    return response.json();
  };

  // Utility function to parse filePaths string
  const parseFilePaths = (filePathStr: string): FileItem[] => {
    try {
      if (typeof filePathStr === "string") {
        const jsonStr = filePathStr.replace(/'/g, '"').replace(/\\\\/g, "/");
        return JSON.parse(jsonStr);
      }
      return filePathStr || [];
    } catch {
      console.warn("Could not parse filePaths");
      return [];
    }
  };

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      try {
        const data = await apiCall(`/admin/dataset/${datasetId}`, "GET");
        const dataset = data.dataset;

        setDatasetName(dataset.name);
        setDatasetDescription(dataset.description);
        setDatasetVersion(dataset.version);
        setOriginalName(dataset.name);
        setOriginalDescription(dataset.datasetDescription || "");
        setFilePaths(parseFilePaths(dataset.filePath || ""));

        const formattedDate = new Date(dataset.uploadDate).toLocaleDateString(
          "en-GB",
          { year: "numeric", month: "long", day: "numeric" },
        );
        setUploadDate(formattedDate);
      } catch (error) {
        console.error("Error fetching dataset details:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load dataset",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetDetails();
  }, [datasetId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles: { file: File; label: string }[] = [];
    for (const file of e.target.files) {
      newFiles.push({ file, label: "paper" }); // Default label
    }
    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    const updated = [...selectedFiles];
    updated[index].label = newLabel;
    setSelectedFiles(updated);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = (filePath: string) => {
    console.log(`Marking image for deletion: ${filePath}`);
    setImagesToDelete([...imagesToDelete, filePath]);
    setFilePaths(filePaths.filter((item) => item.filePath !== filePath));
  };

  // Check if any changes have been made
  const hasChanges =
    datasetName !== originalName ||
    datasetDescription !== originalDescription ||
    selectedFiles.length > 0 ||
    imagesToDelete.length > 0;

  const handleUpdateDatasetInfo = async () => {
    try {
      await apiCall("/admin/dataset/update", "PUT", {
        dataset_id: datasetId,
        new_name: datasetName,
        datasetDescription: datasetDescription,
      });
      alert("Dataset information updated successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length > 0 && selectedFiles.some((item) => !item.label)) {
      alert("Please select a label for all images");
      return;
    }

    setUploading(true);
    try {
      let imageData: { filename: string; label: string; fileData: string }[] =
        [];

      // Only process images if any are selected
      if (selectedFiles.length > 0) {
        imageData = await Promise.all(
          selectedFiles.map(
            (item) =>
              new Promise<{
                filename: string;
                label: string;
                fileData: string;
              }>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(",")[1];
                  resolve({
                    filename: item.file.name,
                    label: item.label,
                    fileData: base64,
                  });
                };
                reader.readAsDataURL(item.file);
              }),
          ),
        );
      }

      const updatePayload: Record<string, Record<string, unknown>> = {
        dataset_id: datasetId,
        new_name: datasetName,
        datasetDescription: datasetDescription,
      };

      // Add images to delete if any
      if (imagesToDelete.length > 0) {
        console.log(
          `Sending ${imagesToDelete.length} images to delete:`,
          imagesToDelete,
        );
        updatePayload.images_to_delete = imagesToDelete;
      }

      // Only increment version and add images if images exist
      if (imageData.length > 0) {
        const newVersion = ((parseFloat(datasetVersion) || 1.0) + 0.1).toFixed(
          1,
        );
        updatePayload.version = newVersion;
        updatePayload.images = imageData;
      }

      console.log("Sending update payload:", updatePayload);
      await apiCall("/admin/dataset/update", "PUT", updatePayload);

      alert("Dataset updated successfully!");
      setSelectedFiles([]);
      setImagesToDelete([]);
      router.push("/admin/datasets");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {loading && <p>Loading dataset details...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {datasetName && (
        <div className="bg-gray-100 p-8">
          <h1 className="text-4xl font-bold mb-8 text-emerald-800">
            Dataset Update
          </h1>

          <div className="flex items-center gap-4 mb-4">
            <label className="text-xl font-bold min-w-fit">Name:</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 flex-1"
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="text-xl font-bold min-w-fit">Description:</label>
            <input
              type="text"
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 flex-1"
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <p className="text-lg font-semibold">Version: {datasetVersion}</p>
            <p className="text-sm text-gray-600">Uploaded: {uploadDate}</p>
          </div>

          {/* Images display in cards: */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-6 text-emerald-800">
              Images ({filePaths.length + selectedFiles.length})
            </h3>
            <div className="flex flex-wrap gap-6">
              {/* Existing images */}
              {Array.isArray(filePaths) &&
                filePaths.map((item, index) => {
                  // Extract filePath from object
                  const filePath =
                    typeof item === "string" ? item : item.filePath;
                  const originalFilename =
                    typeof item === "object"
                      ? item.originalFilename
                      : filePath.split("/").pop();

                  const imageUrl = `http://localhost:8000/${filePath}`;
                  return (
                    <div
                      key={`existing-${index}`}
                      className="bg-white rounded-lg shadow-md p-4 w-56 relative"
                    >
                      <img
                        src={imageUrl}
                        alt={`Dataset Image ${index + 1}`}
                        className="w-full h-56 object-cover rounded-md mb-4"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <p className="text-xs text-gray-600 truncate mb-2">
                        {originalFilename}
                      </p>
                      <button
                        onClick={() => handleDeleteExistingImage(filePath)}
                        className="w-full px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}

              {/* New images to be added */}
              {selectedFiles.map((item, index) => (
                <div
                  key={`new-${index}`}
                  className="bg-white rounded-lg shadow-md p-4 w-56 relative"
                >
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt={item.file.name}
                    className="w-full h-56 object-cover rounded-md mb-3"
                  />
                  <p className="text-xs text-gray-600 mb-3 truncate">
                    {item.file.name}
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={item.label}
                      onChange={(e) => handleLabelChange(index, e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      {ALLOWED_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Add new images card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group bg-white rounded-lg shadow-md p-4 w-56 h-56 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-emerald-50 transition-all duration-200 border-2 border-dashed border-emerald-200 hover:border-emerald-400"
              >
                <span className="text-5xl text-emerald-600 font-bold mb-2 transition-transform duration-500 group-hover:rotate-180">
                  +
                </span>
                <p className="text-xs text-gray-600 text-center font-medium">
                  Add images
                </p>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Update button - shown when there are changes */}
          {hasChanges && (
            <div className="mt-8 pt-2">
              <div className="flex gap-4">
                <button
                  onClick={handleUploadImages}
                  disabled={uploading}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {uploading ? "Uploading..." : "Update Dataset"}
                </button>
                <button
                  onClick={() => setSelectedFiles([])}
                  disabled={uploading}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
