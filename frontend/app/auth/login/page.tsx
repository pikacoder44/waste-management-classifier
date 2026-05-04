"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Lock,
  LogIn,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
const Login = () => {
  const router = useRouter();
  const { setRole } = useAuth();
  const [role, setRoleState] = useState("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loginUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const cleanedUsername = username.trim().toLowerCase();
    const trimmedPassword = password.trim();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username: cleanedUsername,
            password: trimmedPassword,
            role,
          }),
        },
      );

      const text = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", text);

      if (!response.ok) {
        const errorData = JSON.parse(text);
        let errorMessage = "Login failed";

        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Handle validation errors
          errorMessage = errorData.detail.map((err) => err.msg).join(", ");
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (response.ok) {
        setRole(role);
        // Store token expiry from response
        const data = JSON.parse(text);
        if (data.expiresAt) {
          localStorage.setItem("tokenExpiry", data.expiresAt.toString());
        }
      }

      const data = JSON.parse(text);
      console.log("Success:", data);

      setSuccess(data.message || "Login successful! Redirecting...");

      // Redirect based on role
      setTimeout(() => {
        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      }, 1500);
    } catch (error) {
      console.error("Error logging in:", error);
      const errorMsg =
        error instanceof Error ? error.message : "An error occurred";
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-emerald-50 via-white to-emerald-50 px-4 py-8 sm:p-4 animate-page-enter">
      {/* Form Container */}
      <div className="w-full max-w-md mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up [animation-delay:80ms]">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              WasteClassifier
            </h1>
          </div>
          <p className="text-gray-600 text-base">Sign in to your account</p>
        </div>

        {/* Form */}
        <form
          onSubmit={loginUser}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 animate-fade-in-up [animation-delay:160ms]"
        >
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Role Field */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRoleState(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none transition"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/50"
          >
            <LogIn className="w-5 h-5" />
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Navigation Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <a
                href="/auth/register"
                className="text-emerald-600 font-semibold hover:text-emerald-700 underline"
              >
                Register here
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
