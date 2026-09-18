import React from "react";
import Skeleton from "./ui/Skeleton";

export default function DashboardCard({ label, value, hint, loading = false }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      {loading ? <><Skeleton className="mt-2 h-8 w-20" /><Skeleton className="mt-2 h-3 w-28" /></> : <><div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>{hint ? <div className="mt-1 text-[11px] text-slate-500">{hint}</div> : null}</>}
    </div>
  );
}
