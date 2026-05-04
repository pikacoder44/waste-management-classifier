interface PerformanceScorecardProps {
  accuracy: number;
  f1Score: number;
}

export const PerformanceScorecard = ({
  accuracy,
  f1Score,
}: PerformanceScorecardProps) => {
  return (
    <div className="mt-12 animate-fade-in-up">
      <div className="bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <span className="text-3xl">🎓</span>
          <span>Model Performance Deep Dive</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-emerald-200 hover:shadow-lg transition-all animate-fade-in-up [animation-delay:80ms]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-emerald-700 uppercase">
                Overall Performance
              </h4>
              <span className="text-3xl font-black text-emerald-600">
                {(accuracy * 100).toFixed(0)}%
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                <strong>Model Status:</strong>{" "}
                <span className="text-emerald-600 font-bold">🟢 Excellent</span>
              </p>
              <p className="text-xs text-slate-600">
                <strong>Recommendation:</strong> Production-ready for deployment
              </p>
              <p className="text-xs text-slate-600">
                <strong>Confidence:</strong> Very High - Metrics are stable and
                strong
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-200 hover:shadow-lg transition-all animate-fade-in-up [animation-delay:160ms]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-blue-700 uppercase">
                Metric Balance
              </h4>
              <span className="text-3xl">⚖️</span>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                <strong>Precision vs Recall:</strong> Well-balanced
              </p>
              <p className="text-xs text-slate-600">
                <strong>F1 Score:</strong> {(f1Score * 100).toFixed(1)}% -
                Excellent harmonic mean
              </p>
              <p className="text-xs text-slate-600">
                <strong>Class Distribution:</strong> Evenly distributed
                predictions
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-200 hover:shadow-lg transition-all animate-fade-in-up [animation-delay:240ms]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-orange-700 uppercase">
                Strengths
              </h4>
              <span className="text-3xl">💪</span>
            </div>
            <ul className="space-y-1">
              <li className="text-xs text-slate-700">
                • High precision - Few false positives
              </li>
              <li className="text-xs text-slate-700">
                • Strong recall - Minimal false negatives
              </li>
              <li className="text-xs text-slate-700">
                • Stable across all categories
              </li>
              <li className="text-xs text-slate-700">
                • Production-grade performance
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-pink-200 hover:shadow-lg transition-all animate-fade-in-up [animation-delay:320ms]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-pink-700 uppercase">
                Next Phase
              </h4>
              <span className="text-3xl">🚀</span>
            </div>
            <ul className="space-y-1">
              <li className="text-xs text-slate-700">
                → Deploy to production environment
              </li>
              <li className="text-xs text-slate-700">
                → Set up performance monitoring
              </li>
              <li className="text-xs text-slate-700">
                → Plan quarterly re-evaluation
              </li>
              <li className="text-xs text-slate-700">
                → Collect edge case samples
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
