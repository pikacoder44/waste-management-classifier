"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  Save,
  RotateCcw,
} from "lucide-react";

interface FileItem {
  filePath: string;
  label: string;
  originalFilename: string;
}
interface UpdateDatasetPayload {
  dataset_id: string;
  new_name?: string;
  description?: string;
  datasetDescription?: string;
  version?: string;
  images?: { filename: string; label: string; fileData: string }[];
  images_to_delete?: string[];
}

const ALLOWED_LABELS = [
  "cardboard",
  "paper",
  "metal",
  "glass",
  "plastic",
  "trash",
];

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "avif",
]);

const isSupportedImageFile = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    (extension !== undefined && ALLOWED_IMAGE_EXTENSIONS.has(extension))
  );
};

const getLabelBadgeClasses = (label: string) => {
  switch (label) {
    case "cardboard":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "paper":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "metal":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "glass":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "plastic":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "trash":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getLabelCardClasses = (label: string) => {
  switch (label) {
    case "cardboard":
      return "border-amber-300 bg-amber-50/80 hover:border-amber-400";
    case "paper":
      return "border-sky-300 bg-sky-50/80 hover:border-sky-400";
    case "metal":
      return "border-slate-300 bg-slate-50/80 hover:border-slate-400";
    case "glass":
      return "border-emerald-300 bg-emerald-50/80 hover:border-emerald-400";
    case "plastic":
      return "border-blue-300 bg-blue-50/80 hover:border-blue-400";
    case "trash":
      return "border-rose-300 bg-rose-50/80 hover:border-rose-400";
    default:
      return "border-gray-200 bg-white hover:border-gray-300";
  }
};

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Utility function for API calls
  const apiCall = async (
    endpoint: string,
    method: string,
    body?: Record<string, unknown> | UpdateDatasetPayload,
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
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
        // dataset.description is the correct field returned by the API
        setOriginalDescription(dataset.description || "");
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

    const files = Array.from(e.target.files);
    const validFiles = files.filter(isSupportedImageFile);
    const rejectedFiles = files.filter((file) => !isSupportedImageFile(file));

    if (rejectedFiles.length > 0) {
      setActionError(
        `Only image files are allowed. Ignored: ${rejectedFiles.map((file) => file.name).join(", ")}`,
      );
    } else {
      setActionError(null);
    }

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const newFiles: { file: File; label: string }[] = validFiles.map(
      (file) => ({ file, label: "paper" }),
    );
    setSelectedFiles([...selectedFiles, ...newFiles]);
    e.target.value = "";
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

  // Validation: dataset name must be non-empty
  const nameIsValid = datasetName.trim().length > 0;

  // Check if any changes have been made
  const nameChanged = datasetName.trim() !== originalName.trim();
  const descriptionChanged = datasetDescription !== originalDescription;
  const hasChanges =
    nameChanged ||
    descriptionChanged ||
    selectedFiles.length > 0 ||
    imagesToDelete.length > 0;

  const handleUploadImages = async () => {
    const invalidFiles = selectedFiles.filter(
      (item) => !isSupportedImageFile(item.file),
    );

    if (invalidFiles.length > 0) {
      setActionError(
        `Only image files are allowed. Remove: ${invalidFiles.map((item) => item.file.name).join(", ")}`,
      );
      return;
    }

    if (selectedFiles.length > 0 && selectedFiles.some((item) => !item.label)) {
      setActionError("Please select a label for all images");
      return;
    }

    setUploading(true);
    setActionError(null);
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

      const updatePayload: UpdateDatasetPayload = {
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
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 animate-page-enter">
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl animate-soft-float" />
      <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-200/20 blur-3xl animate-soft-float [animation-delay:1000ms]" />
      {loading && (
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="mb-6 flex justify-center">
              <div className="relative w-16 h-16">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Loading Dataset
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch your dataset details...
            </p>
          </div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-center mb-4 w-12 h-12 bg-red-100 rounded-full mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Error Loading Dataset
            </h2>
            <p className="text-center text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )}
      {!loading && !error && (
        <div className="px-4 py-8 sm:p-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <Edit3 className="w-8 h-8 text-emerald-600" />
                <h1 className="text-4xl font-bold text-gray-900">
                  Update Dataset
                </h1>
              </div>
              <p className="text-gray-600 sm:ml-11">
                Make changes to your dataset information and images
              </p>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 mb-8 animate-fade-in-up [animation-delay:100ms]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dataset Name
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={datasetDescription}
                    onChange={(e) => setDatasetDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Version and Upload Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">
                    Version:
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {datasetVersion}
                  </span>
                </div>
                <div className="flex items-center justify-start sm:justify-end">
                  <span className="text-sm text-gray-600">
                    Uploaded:{" "}
                    <span className="font-semibold">{uploadDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Images display in cards: */}
            <div className="mb-8 animate-fade-in-up [animation-delay:180ms]">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <span>Images</span>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-lg font-semibold">
                  {filePaths.length + selectedFiles.length}
                </span>
              </h3>
              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  {actionError}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-6">
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
                    const label =
                      typeof item === "object" ? item.label : "Unknown";

                    const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/${filePath}`;
                    return (
                      <div
                        key={`existing-${index}`}
                        className={`group rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 w-full max-w-56 relative animate-fade-in-up border ${getLabelCardClasses(label)}`}
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <div className="relative h-56 bg-white/60 overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={`Dataset Image ${index + 1}`}
                            fill
                            className="object-cover"
                            priority={false}
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.src = "/fallback-image.png";
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getLabelBadgeClasses(label)}`}
                          >
                            {label}
                          </span>
                          <p className="text-xs text-gray-600 truncate mb-3">
                            {originalFilename}
                          </p>
                          <button
                            onClick={() => handleDeleteExistingImage(filePath)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm transition"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {/* New images to be added */}
                {selectedFiles.map((item, index) => (
                  <div
                    key={`new-${index}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 w-full max-w-56 animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="relative h-56 bg-gray-100">
                      <Image
                        src={URL.createObjectURL(item.file)}
                        alt={item.file.name}
                        fill
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-600 mb-3 truncate">
                        {item.file.name}
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={item.label}
                          onChange={(e) =>
                            handleLabelChange(index, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        >
                          {ALLOWED_LABELS.map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new images card */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group bg-linear-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-md p-6 w-full max-w-56 h-56 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-dashed border-emerald-300 hover:border-emerald-500 animate-fade-in-up"
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
              <div className="mt-8 animate-fade-in-up [animation-delay:180ms]">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    You have unsaved changes
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleUploadImages}
                      disabled={uploading || !nameIsValid}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/50"
                    >
                      <Save className="w-5 h-5" />
                      {uploading ? "Updating..." : "Update Dataset"}
                    </button>
                    <button
                      onClick={() => (
                        setSelectedFiles([]),
                        router.push("/admin/datasets")
                      )}
                      disabled={uploading}
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg disabled:cursor-not-allowed transition-all"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                  {!nameIsValid && (
                    <p className="mt-3 text-sm text-red-600">
                      Dataset name cannot be empty.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
