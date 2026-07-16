interface MetricCardProps {
  label: string; // metric name
  value: number; // 0-1 range
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  desc: string;
}

export const MetricCard = ({
  label,
  value,
  icon,
  color,
  bgColor,
  borderColor,
  desc,
}: MetricCardProps) => {
  const percentage = (value * 100).toFixed(1); // Convert to percentage - 1 decimal place

  return (
    <div
      className={`bg-white border-2 ${borderColor} rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 animate-fade-in-up`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor} text-lg font-bold`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {label}
          </p>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-slate-900 to-slate-700">
          {percentage}%
        </p>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${color} transition-all duration-700 shadow-lg`}
          style={{
            width: `${Math.min(100, parseFloat(percentage))}%`,
          }}
        />
      </div>
      <p className="text-xs text-slate-600 mt-3 font-medium">{desc}</p>
    </div>
  );
};
