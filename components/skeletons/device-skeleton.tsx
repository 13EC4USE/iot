export function DeviceSkeleton() {
  return (
    <div className="bg-slate-700 rounded-lg p-4 animate-pulse">
      <div className="h-6 bg-slate-600 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-600 rounded w-full"></div>
        <div className="h-4 bg-slate-600 rounded w-5/6"></div>
        <div className="h-4 bg-slate-600 rounded w-2/3"></div>
      </div>
      <div className="h-10 bg-slate-600 rounded w-full mt-4"></div>
    </div>
  )
}

export function DeviceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DeviceSkeleton key={i} />
      ))}
    </div>
  )
}
