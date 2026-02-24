export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
        <p className="text-sm text-slate-500">Analyzing image...</p>
      </div>
    </div>
  );
}
