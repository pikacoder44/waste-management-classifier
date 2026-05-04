import { Camera, RefreshCw, Cpu, Leaf, CheckCircle2 } from "lucide-react";

const Page = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-slate-900 font-sans py-12 sm:py-16 lg:py-24 animate-page-enter">
      <div className="pointer-events-none absolute -top-24 left-0 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl animate-soft-float" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl animate-soft-float [animation-delay:1200ms]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Learn More
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            About the <span className="text-emerald-600">Project</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            An intelligent AI-powered system for waste classification and
            sustainable disposal guidance
          </p>
        </div>

        {/* What It Does Card */}
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up [animation-delay:120ms]">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                Overview
              </p>
              <h2 className="text-3xl font-bold text-slate-900">
                What It Does
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                The Smart Waste Classifier uses a deep learning model
                (MobileNetV2) trained on thousands of waste images to
                automatically classify items into six categories: cardboard,
                glass, metal, paper, plastic, and trash.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Upload a photo or use your camera to capture an image, and the
                AI model will predict its category along with a confidence score
                to help with proper waste sorting and recycling.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-4 space-y-3">
                <div className="flex items-center gap-2 animate-fade-in-up [animation-delay:140ms]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-600 font-semibold">
                    Real-time classification
                  </p>
                </div>
                <div className="flex items-center gap-2 animate-fade-in-up [animation-delay:220ms]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-600 font-semibold">
                    High accuracy predictions
                  </p>
                </div>
                <div className="flex items-center gap-2 animate-fade-in-up [animation-delay:300ms]">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-600 font-semibold">
                    Eco-friendly disposal guidance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Card */}
        <div>
          <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up [animation-delay:200ms]">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                Process
              </p>
              <h2 className="text-3xl font-bold text-slate-900">
                How It Works
              </h2>
            </div>
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  icon: Camera,
                  title: "Upload or Capture",
                  desc: "Choose an image from your device or use your camera to capture a photo of the waste item.",
                },
                {
                  step: "2",
                  icon: RefreshCw,
                  title: "Image Processing",
                  desc: "The image is automatically resized to 224×224 pixels and normalized for model input.",
                },
                {
                  step: "3",
                  icon: Cpu,
                  title: "AI Prediction",
                  desc: "The trained MobileNetV2 model analyzes the image and predicts the waste category.",
                },
                {
                  step: "4",
                  icon: Leaf,
                  title: "View Results",
                  desc: "Get instant results with confidence score and disposal recommendations for proper sorting.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
                  style={{
                    animationDelay: `${80 + (Number(item.step) - 1) * 120}ms`,
                  }}
                >
                  <div className="shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 animate-soft-float">
                      <item.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
