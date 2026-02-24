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
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.25em] text-indigo-300">
            Smart Skin Analyzer
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Upload a picture to{" "}
            <span className="bg-linear-to-r from-indigo-300 via-sky-400 to-emerald-300 bg-clip-text text-transparent">
              get instant results
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Choose an image from your device or capture one using your camera.
            Our model will analyze it and show the prediction with confidence
            score.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          <form
            className="relative overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 sm:p-8 shadow-2xl shadow-slate-950/60 backdrop-blur-xl flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              upload_image();
            }}
          >
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                Upload your image
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Supported formats: JPG, PNG. For best results, use a clear and
                well-lit image.
              </p>
            </div>

            <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-900/60 px-4 py-8 text-center transition-all duration-300 hover:border-indigo-400/80 hover:bg-slate-900/90">
              <div className="pointer-events-none space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 shadow-inner shadow-indigo-500/30 transition-transform duration-300 group-hover:scale-110">
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
                  <p className="text-sm sm:text-base font-medium text-slate-100">
                    Click to choose an image
                  </p>
                  <p className="text-xs text-slate-400">
                    or drag and drop it here
                  </p>
                  {file && (
                    <p className="mt-2 text-xs text-emerald-300">
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
              className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-indigo-500 via-sky-500 to-emerald-400 px-6 py-2.5 text-sm sm:text-base font-medium text-slate-950 shadow-lg shadow-indigo-500/40 transition-all duration-300 hover:brightness-110 hover:shadow-indigo-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!file}
            >
              Analyze image
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/70 text-[10px] text-indigo-200 shadow-inner shadow-slate-900/80">
                AI
              </span>
            </button>

            <p className="text-[11px] text-slate-500">
              Your image is processed securely and never stored permanently.
            </p>

            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-emerald-400/5 blur-3xl" />
          </form>

          <div
            className={`relative transform rounded-3xl border border-slate-700/70 bg-slate-900/80 p-6 sm:p-7 shadow-2xl shadow-slate-950/60 backdrop-blur-xl transition-all duration-500 ease-out ${
              hasResult
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Result
                </p>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-50">
                  Prediction overview
                </h2>
              </div>
              {hasResult && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-400/40">
                  Ready
                </span>
              )}
            </div>

            {hasResult ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="relative mx-auto sm:mx-0 h-40 w-40 overflow-hidden rounded-2xl border border-slate-600/80 bg-slate-900/80 shadow-lg shadow-slate-950/80">
                    <Image
                      src={URL.createObjectURL(submittedFile as File)}
                      alt="Uploaded Image"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/50 via-transparent to-transparent" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Predicted class
                      </p>
                      <p className="mt-1 inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-indigo-200">
                        {result}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Confidence
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-base font-semibold text-emerald-300">
                          {(confidence * 100).toFixed(2)}%
                        </p>
                        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-emerald-400 via-sky-400 to-indigo-400 transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, confidence * 100)
                              ).toFixed(1)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  This prediction is generated by your trained model. Use it as
                  a decision aid, not a final diagnosis.
                </p>
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
