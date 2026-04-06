import * as data from "@/utils/evaluation_results.json";
import Image from "next/image";

const Page = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Performance Analysis
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Model <span className="text-emerald-600">Evaluation</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Comprehensive evaluation metrics and confusion matrix for the waste
            classification model
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: "Accuracy",
              value: (data.accuracy * 100).toFixed(1),
              icon: "✓",
              color: "bg-emerald-50 text-emerald-600",
              barColor: "bg-emerald-600",
              desc: "Overall correct predictions",
            },
            {
              label: "Precision",
              value: (data.precision * 100).toFixed(1),
              icon: "⚡",
              color: "bg-blue-50 text-blue-600",
              barColor: "bg-blue-600",
              desc: "Positive prediction accuracy",
            },
            {
              label: "Recall",
              value: (data.recall * 100).toFixed(1),
              icon: "🎯",
              color: "bg-purple-50 text-purple-600",
              barColor: "bg-purple-600",
              desc: "True positive detection rate",
            },
            {
              label: "F1 Score",
              value: (data.f1_score * 100).toFixed(1),
              icon: "⭐",
              color: "bg-orange-50 text-orange-600",
              barColor: "bg-orange-600",
              desc: "Harmonic mean of metrics",
            },
          ].map((metric, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.color} text-lg`}
                >
                  {metric.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {metric.label}
                  </p>
                </div>
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-3">
                {metric.value}%
              </p>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${metric.barColor} transition-all duration-500`}
                  style={{
                    width: `${Math.min(100, parseFloat(metric.value))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-3">{metric.desc}</p>
            </div>
          ))}
        </div>

        {/* Confusion Matrix Section */}
        <div>
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                Classification Detail
              </p>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Confusion Matrix
              </h2>
              <p className="text-slate-600">
                Rows represent actual classes, columns represent predicted
                classes. Diagonal values indicate correct predictions.
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <Image
                  src="/Confusion_Matrix.PNG"
                  alt="Confusion Matrix"
                  width={550}
                  height={550}
                  className="w-full h-auto"
                />
              </div>
            </div>

            <p className="text-sm text-slate-600 text-center leading-relaxed">
              The confusion matrix visualizes the model's classification
              performance across all waste categories. Darker values along the
              diagonal indicate strong classification accuracy for each waste
              type.
            </p>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-xl">📊</span> Model Performance
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ High accuracy across all waste categories</li>
              <li>✓ Balanced precision and recall metrics</li>
              <li>✓ Minimal misclassification between similar categories</li>
              <li>✓ Robust model suitable for real-world deployment</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-xl">🎯</span> Training Details
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Model: MobileNetV2 (Transfer Learning)</li>
              <li>• Input Size: 224×224 RGB Images</li>
              <li>• Epochs: 20 with data augmentation</li>
              <li>• Dataset: TrashNet (2,527 images)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
