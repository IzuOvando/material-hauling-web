export default function DashboardFrenteLoading() {
  return (
    <div className="space-y-4">
      {/* Filter row skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-slate-200 animate-pulse shrink-0" />
        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-xl bg-secondary/80 animate-pulse" />
          <div className="h-9 w-14 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-9 w-14 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>

      {/* Stats bar skeleton — matches actual component: dark cell + 5 metric cells */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex">
          <div className="px-5 py-3 bg-primary min-w-[130px] flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-white/20 animate-pulse" />
            <div className="h-6 w-8 rounded bg-white/20 animate-pulse" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5 px-4 py-3 flex-1 border-l border-slate-200">
              <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
              <div className="h-5 w-10 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b border-slate-200 pb-0">
        <div className="h-9 w-24 rounded-t-md bg-slate-200 animate-pulse" />
        <div className="h-9 w-28 rounded-t-md bg-slate-100 animate-pulse" />
        <div className="h-9 w-32 rounded-t-md bg-slate-100 animate-pulse" />
      </div>

      {/* Chart area skeleton */}
      <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
    </div>
  );
}
