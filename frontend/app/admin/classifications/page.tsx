"use client";
import { useState, useEffect } from "react";

interface ClassificationEntry {
  _id: string;
  userId?: string;
  wasteType: string;
  confidence: number;
  imageUrl?: string;
  createdAt: string;
}

const Page = () => {
  const [classificationHistory, setClassificationHistory] = useState<
    ClassificationEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch classification history from the backend
    const fetchClassificationHistory = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/admin/classification/history",
          {
            credentials: "include", // Send cookies with request
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }

        const data: { status: string; history: ClassificationEntry[] } =
          await response.json();
        setClassificationHistory(data.history || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load classification history",
        );
        setClassificationHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassificationHistory();
  }, []);

  if (loading) {
    return <div className="p-4">Loading classification history...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Classification History</h1>
      {classificationHistory.length === 0 ? (
        <p className="text-gray-500">No classifications found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2">ID</th>
                <th className="border border-gray-300 p-2">Waste Type</th>
                <th className="border border-gray-300 p-2">Confidence</th>
                <th className="border border-gray-300 p-2">User ID</th>
                <th className="border border-gray-300 p-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {classificationHistory.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 text-sm">
                    {entry._id}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {entry.wasteType}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {(entry.confidence * 100).toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">
                    {entry.userId || "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2 text-sm">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Page;
