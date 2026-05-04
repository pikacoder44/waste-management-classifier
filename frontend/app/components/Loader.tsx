import { ReactNode } from "react";
import { Zap } from "lucide-react";

interface LoaderProps {
  message?: string;
  icon?: ReactNode;
}

export default function Loader({
  message = "Analyzing image...",
  icon = <Zap className="w-5 h-5 text-emerald-600" />,
}: LoaderProps) {
  return (
    <div className="flex h-full items-center justify-center py-20 animate-fade-in-up">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-100" />
          {/* Animated border */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 border-r-emerald-500 animate-spin" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {icon}
          </div>
        </div>
        
        {/* Message */}
        <p className="text-sm font-medium text-slate-600">
          {message}
        </p>
      </div>
    </div>
  );
}
