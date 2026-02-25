const Page = () => {
  const categories = [
    {
      name: "Cardboard",
      icon: (
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
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      color: "amber",
    },
    {
      name: "Glass",
      icon: (
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "sky",
    },
    {
      name: "Metal",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      color: "slate",
    },
    {
      name: "Paper",
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: "emerald",
    },
    {
      name: "Plastic",
      icon: (
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      color: "rose",
    },
    {
      name: "Trash",
      icon: (
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      color: "violet",
    },
  ];

  const colorMap: Record<
    string,
    {
      bg: string;
      text: string;
      border: string;
      shadow: string;
      iconBg: string;
      iconShadow: string;
      blur: string;
    }
  > = {
    rose: {
      bg: "bg-white/90",
      text: "text-rose-600",
      border: "border-rose-100",
      shadow: "shadow-rose-100/60",
      iconBg: "bg-rose-50",
      iconShadow: "shadow-rose-100",
      blur: "bg-rose-200/30",
    },
    amber: {
      bg: "bg-white/90",
      text: "text-amber-600",
      border: "border-amber-100",
      shadow: "shadow-amber-100/60",
      iconBg: "bg-amber-50",
      iconShadow: "shadow-amber-100",
      blur: "bg-amber-200/30",
    },
    sky: {
      bg: "bg-white/90",
      text: "text-sky-600",
      border: "border-sky-100",
      shadow: "shadow-sky-100/60",
      iconBg: "bg-sky-50",
      iconShadow: "shadow-sky-100",
      blur: "bg-sky-200/30",
    },
    emerald: {
      bg: "bg-white/90",
      text: "text-emerald-600",
      border: "border-emerald-100",
      shadow: "shadow-emerald-100/60",
      iconBg: "bg-emerald-50",
      iconShadow: "shadow-emerald-100",
      blur: "bg-emerald-200/30",
    },
    slate: {
      bg: "bg-white/90",
      text: "text-slate-600",
      border: "border-slate-200",
      shadow: "shadow-slate-100/60",
      iconBg: "bg-slate-50",
      iconShadow: "shadow-slate-100",
      blur: "bg-slate-200/30",
    },
    violet: {
      bg: "bg-white/90",
      text: "text-violet-600",
      border: "border-violet-100",
      shadow: "shadow-violet-100/60",
      iconBg: "bg-violet-50",
      iconShadow: "shadow-violet-100",
      blur: "bg-violet-200/30",
    },
  };

  const techStack = [
    {
      name: "Next.js",
      description: "React framework for the frontend interface",
    },
    { name: "FastAPI", description: "Python backend for serving predictions" },
    {
      name: "TensorFlow / Keras",
      description: "Deep learning model for image classification",
    },
    {
      name: "Tailwind CSS",
      description: "Utility-first styling across the UI",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-rose-50 via-amber-50 to-sky-50 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
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

        {/* What It Does */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-rose-100/80 backdrop-blur-xl mb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Overview
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              What It Does
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            The Waste Classifier System uses a deep learning model trained on
            thousands of waste images to classify items into one of six
            categories. Simply upload a photo or use your camera to capture an
            image of a waste item, and the model will predict its category along
            with a confidence score. The goal is to assist with proper waste
            sorting and promote sustainable recycling practices.
          </p>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />
        </div>

        {/* Waste Categories */}
        <div className="mb-10">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Classification
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              Waste Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {categories.map((cat) => {
              const c = colorMap[cat.color];
              return (
                <div
                  key={cat.name}
                  className={`relative overflow-hidden rounded-2xl border ${c.border} ${c.bg} p-5 shadow-lg ${c.shadow} backdrop-blur-xl text-center`}
                >
                  <div
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${c.iconBg} ${c.text} shadow-inner ${c.iconShadow} mb-3`}
                  >
                    {cat.icon}
                  </div>
                  <p className={`text-sm font-semibold ${c.text}`}>
                    {cat.name}
                  </p>
                  <div
                    className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${c.blur} blur-2xl`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-white/90 p-6 sm:p-8 shadow-xl shadow-amber-100/80 backdrop-blur-xl mb-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Built With
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
              Technology Stack
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStack.map((tech) => (
              <div key={tech.name} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 shadow-inner shadow-amber-100">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {tech.name}
                  </p>
                  <p className="text-xs text-slate-500">{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
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
