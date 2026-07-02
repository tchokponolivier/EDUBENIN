import React from 'react';

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col gap-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between px-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column / Sidebar equivalent */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="h-48 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="h-6 w-32 bg-slate-200 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 rounded"></div>
              <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
              <div className="h-4 w-4/6 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div className="h-64 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <div className="h-6 w-40 bg-slate-200 rounded-lg mb-4"></div>
             <div className="space-y-4 mt-6">
                <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
                <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
                <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
             </div>
          </div>
        </div>

        {/* Right Column / Main Feed equivalent */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-28 bg-white rounded-xl shadow-sm border border-slate-200"></div>
            <div className="h-28 bg-white rounded-xl shadow-sm border border-slate-200"></div>
            <div className="h-28 bg-white rounded-xl shadow-sm border border-slate-200"></div>
          </div>

          {/* Large Card */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="h-8 w-64 bg-slate-200 rounded-lg mb-6"></div>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-50 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
