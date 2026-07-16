"use client";

interface ConfusionMatrixProps {
  cacheKey?: string; // Optional cache key to force image refresh
}

export const ConfusionMatrix = ({ cacheKey = "" }: ConfusionMatrixProps) => {
  const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/evaluation_results/confusionMatrix.png${cacheKey ? `?t=${encodeURIComponent(cacheKey)}` : ""}`;

  return (
    <div className="mt-12 animate-fade-in-up">
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            Confusion Matrix
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl">
            Rows represent actual classes, columns represent predicted classes.
            Diagonal values indicate correct predictions.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-full max-w-3xl rounded-xl overflow-hidden border-2 border-slate-300 bg-linear-to-br from-slate-50 to-slate-100 p-3 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Confusion Matrix"
              className="w-full h-auto max-w-full"
            />
          </div>
        </div>

        <div className="bg-linear-to-r rounded-xl p-4">
          <p className="text-sm text-slate-700 text-center leading-relaxed">
            The confusion matrix visualizes the model&apos;s classification
            performance across all waste categories.
            <span className="font-semibold text-slate-900">
              {" "}
              Darker values along the diagonal indicate strong classification
              accuracy
            </span>
            for each waste type, while off-diagonal values show
            misclassifications between categories.
          </p>
        </div>
      </div>
    </div>
  );
};
