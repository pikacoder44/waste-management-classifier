export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <p className="text-sm text-slate-600 font-medium">Analyzing image...</p>
      </div>
    </div>
  );
}
