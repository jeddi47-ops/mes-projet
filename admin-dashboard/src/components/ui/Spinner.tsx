export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <Spinner className="w-8 h-8" />
    </div>
  );
}
