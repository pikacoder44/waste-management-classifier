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

// This structure supports BOTH object properties (.text) AND the .split() method
interface ColorScheme {
  bg: string;
  text: string;
  badge: string;
  split: (separator?: string | RegExp, limit?: number) => string[];
}

const getCategoryColor = (label: string): ColorScheme => {
  // Define raw style values
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

  // Combine them into a single string so .split(' ') still functions safely
  const combinedString = `${activeTheme.bg} ${activeTheme.text} ${activeTheme.badge}`;

  return {
    ...activeTheme,
    split: (separator, limit) => combinedString.split(separator || ' ', limit)
  };
};

export { getCategoryIcon, getCategoryColor };