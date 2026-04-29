"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { useAuth } from "../context/AuthContext";
import { useState, useLayoutEffect } from "react";

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
});

const handleLogout = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in request/response
      },
    );
    if (!response.ok) {
      throw new Error("Logout failed");
    }
    // Clear localStorage and reload the page
    localStorage.removeItem("userRole");
    window.location.reload();
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

const Navbar = () => {
  const { role } = useAuth();
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    queueMicrotask(() => {
      setHydrated(true);
    });
  }, []);
  return (
    <nav
      className={`bg-white border-b-2 border-emerald-200 shadow-md ${poppins.className}`}
    >
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              {/* Logo background glow */}
              <div className="absolute inset-0 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Logo */}
              <div className="relative w-14 h-14 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300 transform group-hover:scale-110">
                <span className="text-white font-bold text-3xl">♻</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 text-2xl font-bold tracking-tight leading-tight">
                Waste<span className="text-emerald-600">Classifier</span>
              </span>
              <span className="text-emerald-600 text-xs font-bold tracking-widest uppercase">
                AI Waste Management
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {/* Main Navigation */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
              </Link>

              {/* Admin Section */}
              {hydrated && role === "admin" && (
                <>
                  <div className="h-6 w-px bg-slate-300"></div>

                  <Link
                    href="/admin/dashboard"
                    className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    Dashboard
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link
                    href="/admin/evaluation"
                    className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    Evaluation
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link
                    href="/admin/datasets"
                    className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    Datasets
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link
                    href="/admin/retrain"
                    className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    Retrain
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}

              {/* Show Classifications for admin, History for regular users */}
              {hydrated && (
                <>
                  {role === "admin" ? (
                    <Link
                      href="/admin/classifications"
                      className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                    >
                      Classifications
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/history"
                        className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                      >
                        History
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                      </Link>
                      <Link
                        href="/about"
                        className="text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                      >
                        About
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Auth Button */}
            {role && (
              <button
                onClick={handleLogout}
                className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 text-base"
              >
                Logout
              </button>
            )}
            {!role && (
              <Link
                href="/auth/login"
                className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 text-base"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
