"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedAdminRoute } from "@/app/components/ProtectedAdminRoute";
import {
  BarChart3,
  Upload,
  RotateCcw,
  Zap,
  Database as DatabaseIcon,
  Cpu,
} from "lucide-react";

interface AdminClassificationEntry {
  _id: string;
  userId: string;
  predictedLabel: string;
  confidence: number;
  createdAt: string;
}

interface AdminDataset {
  _id: string;
  imageCount: number;
}

interface EvaluationLatest {
  accuracy: number;
}

const Page = () => {
  const [apiHealth, setApiHealth] = useState<{
    online: boolean;
    detail: string;
    checkedAt: string;
  }>({
    online: false,
    detail: "Checking...",
    checkedAt: "",
  });
  const [dbHealth, setDbHealth] = useState<{
    online: boolean;
    detail: string;
  }>({
    online: false,
    detail: "Checking...",
  });
  const [modelHealth, setModelHealth] = useState<{
    online: boolean;
    detail: string;
  }>({
    online: false,
    detail: "Checking...",
  });
  const [recentClassifications, setRecentClassifications] = useState<
    AdminClassificationEntry[]
  >([]);
  const [trainingImagesCount, setTrainingImagesCount] = useState<number>(0);
  const [modelAccuracy, setModelAccuracy] = useState<number | null>(null);

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Unknown time";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMaskedUser = (userId: string) => {
    if (!userId) return "User";
    return `User ${userId.slice(-4)}`;
  };

  useEffect(() => {
    const checkSystemHealth = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        setApiHealth({
          online: false,
          detail: "API base URL missing",
          checkedAt: new Date().toLocaleTimeString(),
        });
        setDbHealth({ online: false, detail: "Cannot check" });
        setModelHealth({ online: false, detail: "Cannot check" });
        return;
      }

      const checkEndpoint = async (endpoint: string) => {
        const start = performance.now();
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          });
          const elapsed = Math.round(performance.now() - start);
          return { response, elapsed };
        } catch {
          return null;
        }
      };

      const [apiResult, dbResult, modelResult] = await Promise.all([
        checkEndpoint("/admin/model/status"),
        checkEndpoint("/admin/datasets"),
        checkEndpoint("/admin/model/status"),
      ]);

      const checkedAt = new Date().toLocaleTimeString();

      if (!apiResult) {
        setApiHealth({
          online: false,
          detail: "Backend unreachable",
          checkedAt,
        });
        setDbHealth({ online: false, detail: "Backend unreachable" });
        setModelHealth({ online: false, detail: "Backend unreachable" });
        return;
      }

      setApiHealth({
        online: true,
        detail: `Response: ${apiResult.elapsed}ms`,
        checkedAt,
      });

      if (!dbResult) {
        setDbHealth({ online: false, detail: "Backend unreachable" });
      } else if (dbResult.response.ok) {
        setDbHealth({
          online: true,
          detail: `Response: ${dbResult.elapsed}ms`,
        });
      } else if (dbResult.response.status === 503) {
        setDbHealth({ online: false, detail: "Database unavailable" });
      } else {
        setDbHealth({
          online: true,
          detail: `API reachable (${dbResult.response.status})`,
        });
      }

      if (!modelResult) {
        setModelHealth({ online: false, detail: "Backend unreachable" });
      } else if (modelResult.response.ok) {
        setModelHealth({
          online: true,
          detail: `Response: ${modelResult.elapsed}ms`,
        });
      } else {
        setModelHealth({
          online: false,
          detail: `Status: ${modelResult.response.status}`,
        });
      }
    };

    checkSystemHealth();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) return;

      try {
        const [historyRes, datasetsRes, evalRes] = await Promise.all([
          fetch(`${baseUrl}/admin/classification/history`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${baseUrl}/admin/datasets`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${baseUrl}/admin/model/evaluation/latest`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          const history: AdminClassificationEntry[] = historyData.history || [];
          setRecentClassifications(history.slice(0, 4));
        }

        if (datasetsRes.ok) {
          const datasetsData = await datasetsRes.json();
          const datasets: AdminDataset[] = datasetsData.datasets || [];
          const totalImages = datasets.reduce(
            (sum, ds) => sum + (Number(ds.imageCount) || 0),
            0,
          );
          setTrainingImagesCount(totalImages);
        }

        if (evalRes.ok) {
          const evalData: EvaluationLatest = await evalRes.json();
          if (typeof evalData.accuracy === "number") {
            setModelAccuracy(evalData.accuracy);
          }
        }
      } catch {
        // Keep dashboard usable if backend data endpoints are unavailable.
      }
    };

    fetchDashboardData();
  }, []);

  const adminFeatures = [
    {
      id: 1,
      title: "Classifications",
      description: "View and manage waste classifications",
      icon: BarChart3,
      href: "/admin/classifications",
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600",
    },
    {
      id: 2,
      title: "Existing Datasets",
      description: "Manage and organize training datasets",
      icon: DatabaseIcon,
      href: "/admin/datasets",
      color: "from-green-500 to-green-600",
      textColor: "text-green-600",
    },
    {
      id: 3,
      title: "Upload Dataset",
      description: "Upload new waste images for training",
      icon: Upload,
      href: "/admin/upload",
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600",
    },
    {
      id: 4,
      title: "Retrain Model",
      description: "Retrain the AI model with new data",
      icon: RotateCcw,
      href: "/admin/retrain",
      color: "from-orange-500 to-orange-600",
      textColor: "text-orange-600",
    },
  ];

  return (
    <ProtectedAdminRoute>
      <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-gray-50 to-gray-100 px-4 py-8 sm:p-8 animate-page-enter">
        <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl animate-soft-float" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl animate-soft-float [animation-delay:1200ms]" />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header Section */}
          <div className="mb-10 sm:mb-12 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Welcome back! Manage your waste classification system from here.
            </p>
          </div>

          {/* Admin Features Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Admin Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {adminFeatures.map((feature, index) => (
                <Link key={feature.id} href={feature.href}>
                  <div
                    className="group h-full bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    {/* Top color bar */}
                    <div
                      className={`h-2 bg-linear-to-r ${feature.color}`}
                    ></div>

                    {/* Card Content */}
                    <div className="p-6">
                      {/* Icon */}
                      <div
                        className={`mb-4 group-hover:scale-110 transition-transform duration-300 ${feature.textColor}`}
                      >
                        <feature.icon className="w-12 h-12" />
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-xl font-bold ${feature.textColor} mb-2`}
                      >
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4">
                        {feature.description}
                      </p>

                      {/* Button */}
                      <button
                        className={`w-full bg-linear-to-r ${feature.color} text-white font-semibold py-2 px-4 rounded-lg group-hover:opacity-90 transition-opacity duration-200`}
                      >
                        Access →
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="bg-linear-to-br from-white to-gray-50 rounded-lg shadow-md p-8 border border-gray-100 animate-fade-in-up [animation-delay:220ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              System Health
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm animate-fade-in-up [animation-delay:320ms]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      API Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${apiHealth.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                      ></div>
                      <span
                        className={`text-lg font-semibold ${apiHealth.online ? "text-green-600" : "text-red-600"}`}
                      >
                        {apiHealth.online ? "Operational" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Last checked: {apiHealth.checkedAt || "Checking..."}
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm animate-fade-in-up [animation-delay:400ms]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      Database
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${dbHealth.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                      ></div>
                      <span
                        className={`text-lg font-semibold ${dbHealth.online ? "text-green-600" : "text-red-600"}`}
                      >
                        {dbHealth.online ? "Connected" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <DatabaseIcon className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-3">{dbHealth.detail}</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm animate-fade-in-up [animation-delay:480ms]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      Model Service
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${modelHealth.online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                      ></div>
                      <span
                        className={`text-lg font-semibold ${modelHealth.online ? "text-green-600" : "text-red-600"}`}
                      >
                        {modelHealth.online ? "Running" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <Cpu className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {modelHealth.detail}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-100 animate-fade-in-up [animation-delay:260ms]">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Classifications
            </h2>
            {recentClassifications.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recent classifications available.
              </p>
            ) : (
              <div className="space-y-3">
                {recentClassifications.map((item, idx) => (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-linear-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${idx * 110}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-emerald-600">
                        <RotateCcw className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 capitalize">
                          {item.predictedLabel}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getMaskedUser(item.userId)} ·{" "}
                          {formatTimestamp(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {(Number(item.confidence || 0) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Overview */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-6 animate-fade-in-up [animation-delay:280ms]">
            Stats Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 animate-fade-in-up [animation-delay:360ms]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Waste Categories
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">6</p>
                </div>
                <span className="text-3xl">🗑️</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 animate-fade-in-up [animation-delay:440ms]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Training Images
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {trainingImagesCount.toLocaleString()}
                  </p>
                </div>
                <span className="text-3xl">🖼️</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500 animate-fade-in-up [animation-delay:520ms]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Model Accuracy
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {modelAccuracy !== null
                      ? `${(modelAccuracy * 100).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                <span className="text-3xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedAdminRoute>
  );
};

export default Page;
