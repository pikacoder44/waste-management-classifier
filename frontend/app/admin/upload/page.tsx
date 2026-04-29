"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
interface ImageFile {
  file: File;
  label: string;
  preview: string;
}

interface UploadResponse {
  status: string;
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  uploaded: Array<{
    originalFilename: string;
    savedFilename: string;
    label: string;
    status: string;
  }>;
  errors?: Array<{
    file: string;
    error: string;
  }>;
}

export default function AdminUploadPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const ALLOWED_LABELS = [
    "cardboard",
    "paper",
    "metal",
    "glass",
    "plastic",
    "trash",
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: ImageFile[] = files.map((file) => ({
      file,
      label: "",
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    setError(null);
  };

  const handleLabelChange = (index: number, label: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, label } : img)),
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview);
      return newImages;
    });
  };

  const handleUpload = async () => {
    // Validate dataset name
    if (!datasetName.trim()) {
      setError("Please enter a dataset name");
      return;
    }

    // Validate that all images have labels
    if (images.some((img) => !img.label)) {
      setError("Please select a label for all images");
      return;
    }

    setUploading(true);
    setError(null);
    setResponse(null);

    try {
      // Convert images to base64 and create payload
      const imageDataPromises = images.map(async (img) => {
        const reader = new FileReader();
        return new Promise<{
          filename: string;
          label: string;
          fileData: string;
        }>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve({
              filename: img.file.name,
              label: img.label,
              fileData: base64,
            });
          };
          reader.readAsDataURL(img.file);
        });
      });

      const imageData = await Promise.all(imageDataPromises);

      // Send to backend
      const res = await fetch("http://localhost:8000/admin/dataset/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          datasetName: datasetName.trim(),
          datasetDescription: datasetDescription.trim() || null,
          images: imageData,
        }),
      });

      console.log("Upload response status:", res.status);
      const data: UploadResponse = await res.json();
      console.log("Upload response data:", data);

      if (!res.ok) {
        setError(data.errors?.[0]?.error || "Upload failed");
      } else {
        setResponse(data);
        setImages([]);
        setDatasetName("");
        setDatasetDescription("");
        router.push("/admin/datasets");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during upload",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Upload New Dataset
          </h1>
          <p className="text-gray-600 mb-8">
            Upload waste images with their corresponding labels
          </p>

          {/* Dataset Name Input */}
          <div className="mb-8 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <label htmlFor="datasetName" className="block mb-2">
              <span className="font-semibold text-gray-900">
                Dataset Name *
              </span>
              <span className="text-sm text-gray-600 ml-2">(Required)</span>
            </label>
            <input
              type="text"
              id="datasetName"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Plastic Waste Collection - March 2026"
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
            />
            <p className="text-sm text-gray-600 mt-1">
              Give this dataset a descriptive name for easy identification
            </p>
            <label htmlFor="datasetDescription">Dataset Description</label>
            <input
              type="text"
              id="datasetDescription"
              value={datasetDescription}
              onChange={(e) => setDatasetDescription(e.target.value)}
              placeholder="Describe your dataset..."
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
            />
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            <label className="block mb-4">
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div>
                  <svg
                    className="mx-auto mb-4 w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-lg font-semibold text-gray-700">
                    Click to upload images
                  </p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </div>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {response && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">
                ✓ Upload completed: {response.successfulUploads} successful,{" "}
                {response.failedUploads} failed
              </p>
              {response.errors && response.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  {response.errors.map((err, i) => (
                    <p key={i}>
                      {err.file}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Images Preview Grid */}
          {images.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Selected Images ({images.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={img.preview}
                        width={400}
                        height={300}
                        alt={`Preview ${index}`}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 truncate">
                        {img.file.name}
                      </p>
                      <select
                        value={img.label}
                        onChange={(e) =>
                          handleLabelChange(index, e.target.value)
                        }
                        className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select label</option>
                        {ALLOWED_LABELS.map((label) => (
                          <option key={label} value={label}>
                            {label.charAt(0).toUpperCase() + label.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={images.length === 0 || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            >
              {uploading
                ? "Uploading..."
                : `Upload ${images.length} Image${images.length !== 1 ? "s" : ""}`}
            </button>
            {images.length > 0 && (
              <button
                onClick={() => {
                  images.forEach((img) => URL.revokeObjectURL(img.preview));
                  setImages([]);
                  setDatasetName("");
                  setDatasetDescription("");
                }}
                disabled={uploading}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold disabled:cursor-not-allowed hover:bg-gray-400 transition"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
