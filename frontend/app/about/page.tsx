const Page = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-rose-50 via-amber-50 to-sky-50 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Learn More
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            About the{" "}
            <span className="bg-linear-to-r from-rose-500 via-amber-500 to-sky-500 bg-clip-text text-transparent">
              Project
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            An AI-powered waste classification system that helps identify and
            sort waste materials for better recycling and disposal.
          </p>
        </div>

        {/* Overview */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-rose-100/80 backdrop-blur-xl mb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Overview
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              What It Does
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
            The Waste Classifier System uses a deep learning model trained on
            thousands of waste images to classify items into one of six
            categories: cardboard, glass, metal, paper, plastic, and trash.
          </p>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Upload a photo or use your camera to capture an image, and the model
            will predict its category along with a confidence score to help with
            proper waste sorting.
          </p>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
        </div>

        {/* How It Works */}
        <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-sky-100/80 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Process
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              How It Works
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Upload or Capture",
                desc: "Choose an image from your device or take a photo using your camera.",
              },
              {
                step: "2",
                title: "Image Processing",
                desc: "The image is resized and normalized before being sent to the classification model.",
              },
              {
                step: "3",
                title: "AI Prediction",
                desc: "A trained deep learning model analyzes the image and predicts the waste category.",
              },
              {
                step: "4",
                title: "View Results",
                desc: "The predicted class and confidence score are displayed so you know how to sort the item.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 text-sm font-bold shadow-inner shadow-sky-100">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-rose-200/35 blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default Page;
