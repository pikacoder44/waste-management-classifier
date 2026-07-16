import React from "react";
import {
  Package,
  BottleWine,
  Hammer,
  FileText,
  Recycle,
  Trash2,
  HelpCircle,
} from "lucide-react";

const getCategoryIcon = (label: string) => {
  const icons: Record<string, React.ReactNode> = {
    cardboard: <Package className="w-12 h-12 text-amber-700" />,
    glass: <BottleWine className="w-12 h-12 text-blue-700" />,
    metal: <Hammer className="w-12 h-12 text-gray-700" />,
    paper: <FileText className="w-12 h-12 text-yellow-700" />,
    plastic: <Recycle className="w-12 h-12 text-purple-700" />,
    trash: <Trash2 className="w-12 h-12 text-red-700" />,
  };
  return (
    icons[label.toLowerCase()] || (
      <HelpCircle className="w-12 h-12 text-gray-700" />
    )
  );
};

interface ColorScheme {
  bg: string;
  text: string;
  border: string;
  split: (separator?: string | RegExp, limit?: number) => string[];
}

const getCategoryColor = (label: string): ColorScheme => {
  const themes: Record<string, { bg: string; text: string; border: string }> = {
    cardboard: {
      bg: "bg-amber-200",
      text: "text-amber-900",
      border: "border-red-200",
    },
    glass: { bg: "bg-blue-200", text: "text-blue-900", border: "border-blue-300" },
    metal: { bg: "bg-gray-300", text: "text-gray-900", border: "border-gray-400" },
    paper: {
      bg: "bg-yellow-200",
      text: "text-yellow-900",
      border: "border-yellow-300",
    },
    plastic: {
      bg: "bg-purple-200",
      text: "text-purple-900",
      border: "border-purple-300",
    },
    trash: { bg: "bg-red-200", text: "text-red-900", border: "border-red-300" },
  };

  const activeTheme = themes[label.toLowerCase()] || {
    bg: "bg-gray-50",
    text: "text-gray-900",
    border: "border-gray-300",
  };

  const combinedString = `${activeTheme.bg} ${activeTheme.text} ${activeTheme.border}`;

  return {
    ...activeTheme,
    split: (separator, limit) => combinedString.split(separator || " ", limit),
  };
};

const getCategoryColorMain = (
  category: string,
): { bg: string; text: string; badge: string } => {
  const colors: Record<string, { bg: string; text: string; badge: string }> = {
    cardboard: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      badge: "bg-amber-100",
    },
    glass: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100" },
    metal: { bg: "bg-gray-50", text: "text-gray-700", badge: "bg-gray-100" },
    paper: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      badge: "bg-yellow-100",
    },
    plastic: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      badge: "bg-purple-100",
    },
    trash: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" },
  };
  return (
    colors[category.toLowerCase()] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      badge: "bg-gray-100",
    }
  );
};

const getConfidenceBarColor = (label: string): string => {
  const colors: Record<string, string> = {
    cardboard: "bg-linear-to-r from-amber-400 via-amber-500 to-amber-600",
    glass: "bg-linear-to-r from-blue-400 via-blue-500 to-blue-600",
    metal: "bg-linear-to-r from-gray-400 via-gray-500 to-gray-600",
    paper: "bg-linear-to-r from-yellow-400 via-yellow-500 to-yellow-600",
    plastic: "bg-linear-to-r from-purple-400 via-purple-500 to-purple-600",
    trash: "bg-linear-to-r from-red-400 via-red-500 to-red-600",
  };
  return (
    colors[label.toLowerCase()] ||
    "bg-linear-to-r from-gray-400 via-gray-500 to-gray-600"
  );
};

const getCategoryHeaderGradient = (label: string): string => {
  const gradients: Record<string, string> = {
    cardboard: "bg-linear-to-r from-amber-500 to-amber-700",
    glass: "bg-linear-to-r from-blue-500 to-blue-700",
    metal: "bg-linear-to-r from-gray-500 to-gray-700",
    paper: "bg-linear-to-r from-yellow-500 to-yellow-700",
    plastic: "bg-linear-to-r from-purple-500 to-purple-700",
    trash: "bg-linear-to-r from-red-500 to-red-700",
  };
  return (
    gradients[label.toLowerCase()] || "bg-linear-to-r from-gray-500 to-gray-700"
  );
};

const getCategoryCardGradient = (label: string): string => {
  const gradients: Record<string, string> = {
    cardboard: "bg-linear-to-br from-amber-100 via-amber-50 to-white",
    glass: "bg-linear-to-br from-blue-100 via-blue-50 to-white",
    metal: "bg-linear-to-br from-gray-200 via-gray-100 to-white",
    paper: "bg-linear-to-br from-yellow-100 via-yellow-50 to-white",
    plastic: "bg-linear-to-br from-purple-100 via-purple-50 to-white",
    trash: "bg-linear-to-br from-red-100 via-red-50 to-white",
  };
  return gradients[label.toLowerCase()] || "from-gray-50 to-gray-100/50";
};

export {
  getCategoryIcon,
  getCategoryColor,
  getConfidenceBarColor,
  getCategoryHeaderGradient,
  getCategoryCardGradient,
  getCategoryColorMain
};
