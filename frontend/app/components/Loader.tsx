import { Loader2, Zap } from "lucide-react";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin absolute inset-0" />
          <Zap className="w-8 h-8 text-emerald-400 absolute inset-4 m-auto" />
        </div>
        <p className="text-sm text-slate-600 font-medium">Analyzing image...</p>
        <div className="flex gap-1">
          <div
            className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
