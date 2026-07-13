import React from 'react'
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
  badge: string;
  split: (separator?: string | RegExp, limit?: number) => string[];
}

const getCategoryColor = (label: string): ColorScheme => {
  const themes: Record<string, { bg: string; text: string; badge: string }> = {
    cardboard: { bg: "bg-amber-50", text: "text-amber-900", badge: "bg-amber-200" },
    glass: { bg: "bg-blue-50", text: "text-blue-900", badge: "bg-blue-200" },
    metal: { bg: "bg-gray-50", text: "text-gray-900", badge: "bg-gray-300" },
    paper: { bg: "bg-yellow-50", text: "text-yellow-900", badge: "bg-yellow-200" },
    plastic: { bg: "bg-purple-50", text: "text-purple-900", badge: "bg-purple-200" },
    trash: { bg: "bg-red-50", text: "text-red-900", badge: "bg-red-200" },
  };

  const activeTheme = themes[label.toLowerCase()] || { 
    bg: "bg-gray-50", 
    text: "text-gray-900", 
    badge: "bg-gray-300" 
  };

  const combinedString = `${activeTheme.bg} ${activeTheme.text} ${activeTheme.badge}`;

  return {
    ...activeTheme,
    split: (separator, limit) => combinedString.split(separator || ' ', limit)
  };
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
    cardboard: "from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10",
    glass: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10",
    metal: "from-gray-50 to-gray-100/50 dark:from-gray-950/20 dark:to-gray-900/10",
    paper: "from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10",
    plastic: "from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10",
    trash: "from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10",
  };
  return (
    gradients[label.toLowerCase()] || "from-gray-50 to-gray-100/50"
  );
};

export { 
  getCategoryIcon, 
  getCategoryColor, 
  getConfidenceBarColor, 
  getCategoryHeaderGradient,
  getCategoryCardGradient
};