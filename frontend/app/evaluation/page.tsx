import * as data from "@/utils/evaluation_results.json";
import Image from "next/image";
const Page = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-linear-to-br from-rose-50 via-amber-50 to-sky-50 text-slate-900 flex flex-col  items-center justify-center px-4 py-10 font-sans">
      <h1 className="text-4xl font-bold text-center mt-10">Evaluation Page</h1>
      <p className="text-center mt-2 text-gray-600 text-xl">
        This page will display the evaluation results of the waste
        classification model.
      </p>

      {/* Evaluation Metrices */}
      <div className="flex flex-row gap-4">
        {/* Card */}
        <div className="mt-10 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Evaluation Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 text-emerald-600 shadow-xl hover:bg-zinc-950 hover:text-emerald-300 hover:p-6 transition-all duration-300 cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Accuracy</h3>
              <p className="text-2xl font-bold">
                {(data.accuracy * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-emerald-600 shadow-xl hover:bg-zinc-950 hover:text-emerald-300 hover:p-6 transition-all duration-300 cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Precision</h3>
              <p className="text-2xl font-bold">
                {(data.precision * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-emerald-600 shadow-xl hover:bg-zinc-950 hover:text-emerald-300 hover:p-6 transition-all duration-300 cursor-pointer">
              <h3 className="text-lg font-medium mb-2">Recall</h3>
              <p className="text-2xl font-bold">
                {(data.recall * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 text-emerald-600 shadow-xl hover:bg-zinc-950 hover:text-emerald-300 hover:p-6 transition-all duration-300 cursor-pointer">
              <h3 className="text-lg font-medium mb-2">F1 Score</h3>
              <p className="text-2xl font-bold">
                {(data.f1_score * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Confusion Matrix  */}
        <div className="mt-10 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Confusion Matrix</h2>
          <Image
            src="/Confusion_Matrix.PNG"
            alt="Confusion Matrix"
            width={400}
            height={400}
          />
        </div>
      </div>
    </div>
  );
};
export default Page;
