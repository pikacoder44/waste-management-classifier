import * as data from "@/utils/evaluation_results.json";
import Image from "next/image";

const Page = () => {

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-rose-50 via-amber-50 to-sky-50 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* ========================================
            HEADER SECTION
            ======================================== */}
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Performance Analysis
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Model{" "}
            <span className="bg-linear-to-r from-rose-500 via-amber-500 to-sky-500 bg-clip-text text-transparent">
              Evaluation
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Comprehensive evaluation metrics and confusion matrix for the waste
            classification model.
          </p>
        </div>

        {/* ========================================
            METRIC CARDS
            ======================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
          {/* Accuracy */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-lg shadow-rose-100/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shadow-inner shadow-rose-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">Accuracy</p>
            </div>
            <p className="text-3xl font-bold text-rose-600">
              {(data.accuracy * 100).toFixed(1)}%
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-400"
                style={{ width: `${(data.accuracy * 100).toFixed(1)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Overall correct predictions
            </p>
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-200/30 blur-2xl" />
          </div>

          {/* Precision */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white/90 p-5 shadow-lg shadow-amber-100/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-inner shadow-amber-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">Precision</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {(data.precision * 100).toFixed(1)}%
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${(data.precision * 100).toFixed(1)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Positive prediction accuracy
            </p>
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />
          </div>

          {/* Recall */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white/90 p-5 shadow-lg shadow-sky-100/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-500 shadow-inner shadow-sky-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">Recall</p>
            </div>
            <p className="text-3xl font-bold text-sky-600">
              {(data.recall * 100).toFixed(1)}%
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-400"
                style={{ width: `${(data.recall * 100).toFixed(1)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              True positive detection rate
            </p>
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-200/30 blur-2xl" />
          </div>

          {/* F1 Score */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-100/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 shadow-inner shadow-emerald-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">F1 Score</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {(data.f1_score * 100).toFixed(1)}%
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${(data.f1_score * 100).toFixed(1)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Harmonic mean of precision & recall
            </p>
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
          </div>
        </div>

        {/* ========================================
            CONFUSION MATRIX
            ======================================== */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-rose-100/80 backdrop-blur-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Classification Detail
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              Confusion Matrix
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Rows represent actual classes, columns represent predicted
              classes.
            </p>
          </div>

          <div className="flex justify-center">
            <Image
              src="/Confusion_Matrix.PNG"
              alt="Confusion Matrix"
              width={550}
              height={550}
              className="rounded-2xl"
            />
          </div>

          <p className="text-sm text-slate-500 mt-6 text-center max-w-xl mx-auto">
            The confusion matrix shows how the model classified each waste
            category. Diagonal values indicate correct predictions, while
            off-diagonal values represent misclassifications between classes.
          </p>

          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default Page;
