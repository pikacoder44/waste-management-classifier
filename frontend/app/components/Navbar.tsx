"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  Home,
  LayoutDashboard,
  BarChart3,
  Database,
  RotateCcw,
  CheckCircle2,
  Clock,
  Info,
  LogOut,
  LogIn,
  Leaf,
  Menu,
  X,
} from "lucide-react";

const Navbar = () => {
  const { role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false); // Only for mobile menu toggle

  const toggleMenu = () => {
    setMenuOpen((open) => !open);
  };
  return (
    <nav className="bg-white border-b-2 border-emerald-200 shadow-md">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">

          {/* Logo & Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              {/* Logo background glow */}
              <div className="absolute inset-0 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Logo */}
              <div className="relative w-14 h-14 rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300 transform group-hover:scale-110">
                <Leaf className="text-white w-8 h-8" />
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
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                aria-label="Open menu"
                className="p-2 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                {menuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Main Navigation (desktop) */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
              >
                <Home className="w-4 h-4" />
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
              </Link>

              {/* Admin Section */}
              {role === "admin" && (
                <>
                  <div className="h-6 w-px bg-slate-300"></div>

                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link
                    href="/admin/evaluation"
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Evaluation
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link
                    href="/admin/datasets"
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    <Database className="w-4 h-4" />
                    Datasets
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link
                    href="/admin/retrain"
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retrain
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}

              {/* Show Classifications for admin, History for regular users */}
              {role === "admin" ? (
                <Link
                  href="/admin/classifications"
                  className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Classifications
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ) : (
                <>
                  {role === "user" && (
                    <Link
                      href="/history"
                      className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                    >
                      <Clock className="w-4 h-4" />
                      History
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  )}

                  <Link
                    href="/about"
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold text-base transition-colors duration-200 relative group"
                  >
                    <Info className="w-4 h-4" />
                    About
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}
            </div>

            {/* Auth Button (desktop) */}
            <div className="hidden md:flex items-center">
              {role ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 text-base"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 text-base"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className="md:hidden overflow-hidden border-t border-slate-200 bg-white"
          // slide animation:
          style={{
            maxHeight: menuOpen ? 520 : 0,
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(-8px)",
            transition:
              "max-height 320ms ease, opacity 220ms ease, transform 220ms ease",
            pointerEvents: menuOpen ? "auto" : "none",
            willChange: "max-height, opacity, transform",
          }}
          aria-hidden={!menuOpen}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
              >
                <Home className="w-4 h-4" /> Home
              </Link>

              {role === "admin" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    href="/admin/evaluation"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                  >
                    <BarChart3 className="w-4 h-4" /> Evaluation
                  </Link>
                  <Link
                    href="/admin/datasets"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                  >
                    <Database className="w-4 h-4" /> Datasets
                  </Link>
                  <Link
                    href="/admin/retrain"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" /> Retrain
                  </Link>
                </>
              )}

              {role === "admin" ? (
                <Link
                  href="/admin/classifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" /> Classifications
                </Link>
              ) : (
                <>
                  {role === "user" && (
                    <Link
                      href="/history"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                    >
                      <Clock className="w-4 h-4" /> History
                    </Link>
                  )}

                  <Link
                    href="/about"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-600 font-semibold"
                  >
                    <Info className="w-4 h-4" /> About
                  </Link>
                </>
              )}

              {/* Auth actions (mobile) */}
              <div className="pt-2">
                {role ? (
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
