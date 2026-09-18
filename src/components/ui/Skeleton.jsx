import React from "react";

export default function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}

export function ListSkeleton({ rows = 3 }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, index) => <div key={index} className="rounded-2xl border border-slate-100 bg-white p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="mt-3 h-3 w-2/3" /><Skeleton className="mt-2 h-3 w-1/2" /></div>)}</div>;
}
