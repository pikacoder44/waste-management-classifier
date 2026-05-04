import Link from "next/link";
import {
  BarChart3,
  Database,
  Upload,
  RotateCcw,
  Zap,
  Database as DatabaseIcon,
  Cpu,
} from "lucide-react";

const Page = () => {
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
      icon: Database,
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
                  <div className={`h-2 bg-linear-to-r ${feature.color}`}></div>

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
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold text-green-600">
                      Operational
                    </span>
                  </div>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Last checked: 2 mins ago
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm animate-fade-in-up [animation-delay:400ms]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    Database
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold text-green-600">
                      Connected
                    </span>
                  </div>
                </div>
                <DatabaseIcon className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-3">Response: 12ms</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm animate-fade-in-up [animation-delay:480ms]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    Model Service
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold text-green-600">
                      Running
                    </span>
                  </div>
                </div>
                <Cpu className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-3">Avg Response: 340ms</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-100 animate-fade-in-up [animation-delay:260ms]">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Classifications
          </h2>
          <div className="space-y-3">
            {[
              {
                waste: "Plastic",
                confidence: 96,
                user: "User #234",
                time: "2 minutes ago",
              },
              {
                waste: "Paper",
                confidence: 89,
                user: "User #567",
                time: "15 minutes ago",
              },
              {
                waste: "Metal",
                confidence: 92,
                user: "User #890",
                time: "28 minutes ago",
              },
              {
                waste: "Glass",
                confidence: 98,
                user: "User #123",
                time: "1 hour ago",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-linear-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${idx * 110}ms` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="text-emerald-600">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.waste}</p>
                    <p className="text-xs text-gray-500">
                      {item.user} · {item.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    {item.confidence}%
                  </p>
                  <p className="text-xs text-gray-500">confidence</p>
                </div>
              </div>
            ))}
          </div>
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
                <p className="text-3xl font-bold text-gray-900 mt-2">1,240</p>
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
                <p className="text-3xl font-bold text-green-600 mt-2">94.2%</p>
              </div>
              <span className="text-3xl">🎯</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
