import { ReactNode } from "react";
import { Loader2, Zap } from "lucide-react";

interface LoaderProps {
  message?: string;
  icon?: ReactNode;
}

export default function Loader({
  message = "Analyzing image...",
  icon = <Zap className="w-8 h-8 text-emerald-500" />,
}: LoaderProps) {
  return (
    <div className="flex h-full items-center justify-center py-20 animate-fade-in-up">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-300/30 blur-2xl animate-glow-pulse" />
          <div className="absolute inset-2 rounded-full border border-emerald-200/80 animate-ring-spin" />
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-500/25 animate-ring-spin [animation-duration:12s] [animation-direction:reverse]" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl shadow-emerald-200/70 animate-soft-float">
            <Loader2 className="absolute h-9 w-9 text-emerald-600 animate-spin [animation-duration:1.1s]" />
            <span className="absolute inset-0 rounded-full bg-emerald-50 animate-ping opacity-60 [animation-duration:2s]" />
            <span className="relative z-10">{icon}</span>
          </div>
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-600 animate-fade-in-up">
          {message}
        </p>
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
