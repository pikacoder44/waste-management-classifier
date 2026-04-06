"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
});

const Navbar = () => {
  return (
    <nav
      className={`bg-white border-b border-slate-200 shadow-sm ${poppins.className}`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">♻</span>
          </div>
          <span className="text-slate-900 text-xl font-bold tracking-wide">
            Waste<span className="text-emerald-600">Classifier</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all font-medium"
          >
            Home
          </Link>
          <Link
            href="/evaluation"
            className="text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all font-medium"
          >
            Evaluation
          </Link>
          <Link
            href="/about"
            className="text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-all font-medium"
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
