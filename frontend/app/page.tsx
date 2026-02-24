"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [file, setFile] = useState<File | null>(null); // newly selected file
  const [submittedFile, setSubmittedFile] = useState<File | null>(null); // file actually submitted
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const upload_image = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Prediction result:", data);
        setResult(data.predicted_class);
        setConfidence(data.confidence);
        setSubmittedFile(file); // store the file that gave this result
      } else {
        console.error("Error uploading image:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const hasResult = result && submittedFile;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-linear-to-br from-rose-50 via-amber-50 to-sky-50 text-slate-900 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-3xl">
        <div className="mb-7 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Upload a picture to{" "}
            <span className="bg-linear-to-r from-rose-500 via-amber-500 to-sky-500 bg-clip-text text-transparent">
              get prediction
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Choose an image from your device or capture one using your camera.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          <form
            className="relative overflow-hidden rounded-3xl border border-amber-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-amber-100/80 backdrop-blur-xl flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              upload_image();
            }}
          >
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Upload your image
              </h2>
            </div>

            <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center transition-all duration-300 hover:border-amber-300 hover:bg-white">
              <div className="pointer-events-none space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 shadow-inner shadow-rose-100 transition-transform duration-300 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-7 w-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v12m0-12L8.5 7.5M12 4l3.5 3.5M6 13v4.5A2.5 2.5 0 0 0 8.5 20h7a2.5 2.5 0 0 0 2.5-2.5V13"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-medium text-slate-900">
                    Click to choose an image
                  </p>
                  <p className="text-xs text-slate-500">
                    or drag and drop it here
                  </p>
                  {file && (
                    <p className="mt-2 text-xs text-emerald-600">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
              <input
                type="file"
                name="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm sm:text-base font-medium text-white shadow-lg shadow-slate-300/60 transition-all duration-300 hover:bg-slate-800 hover:shadow-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!file}
            >
              Analyze image
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-slate-900 shadow-inner shadow-slate-200">
                AI
              </span>
            </button>

            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
          </form>

          <div
            className={`relative transform rounded-3xl border border-rose-100 bg-white/90 p-6 sm:p-7 shadow-xl shadow-rose-100/80 backdrop-blur-xl transition-all duration-500 ease-out ${
              hasResult
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Result
                </p>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Prediction overview
                </h2>
              </div>
              
            </div>

            {hasResult ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative mx-auto sm:mx-0 h-40 w-40 overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 shadow-lg shadow-blue-100">
                    <Image
                      src={URL.createObjectURL(submittedFile as File)}
                      alt="Uploaded Image"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-rose-200/35 via-transparent to-transparent" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Predicted class
                      </p>
                      <p className="mt-1 inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-600">
                        {result}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        Confidence
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-base font-semibold text-emerald-600">
                          {(confidence * 100).toFixed(2)}%
                        </p>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200 border border-gray-200">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, confidence * 100),
                              ).toFixed(1)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                <p>No prediction yet.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Upload an image and submit it to see the result here with a
                  smooth reveal animation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
