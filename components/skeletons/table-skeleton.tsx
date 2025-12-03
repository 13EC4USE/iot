export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-slate-700 rounded-lg overflow-hidden">
      <div className="bg-slate-600 h-12 flex items-center px-4">
        <div className="h-4 bg-slate-500 rounded w-1/4"></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-slate-600 h-12 flex items-center px-4">
          <div className="h-4 bg-slate-600 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}
