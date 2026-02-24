"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
});

const Navbar = () => {
  return (
    <nav className={`bg-gray-800 p-4 ${poppins.className}`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-white text-xl font-bold tracking-wide">
          Waste Classifier System
        </div>
        <div>
          <Link
            href="/"
            className="text-gray-300 hover:text-white px-3 transition"
          >
            Home
          </Link>
          <Link
            href="/evaluation"
            className="text-gray-300 hover:text-white px-3 transition"
          >
            Evaluation
          </Link>
          <Link
            href="/about"
            className="text-gray-300 hover:text-white px-3 transition"
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
