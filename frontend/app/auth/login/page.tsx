"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
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

    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, role }),
      });

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

      if(response.ok){
        setRole(role);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl text-black mb-8">Login Page</h1>

      <form
        onSubmit={loginUser}
        className="flex flex-col gap-4 mt-4 bg-white p-8 rounded-lg shadow-lg w-96"
      >
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <label htmlFor="username" className="font-semibold text-gray-700">
          Username:
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-200"
        />

        <label htmlFor="password" className="font-semibold text-gray-700">
          Password:
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-200"
        />

        <label htmlFor="role" className="font-semibold text-gray-700">
          Role:
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRoleState(e.target.value)}
          disabled={loading}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-700 disabled:bg-gray-200"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 text-white py-2 px-4 rounded mt-4 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-800 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
