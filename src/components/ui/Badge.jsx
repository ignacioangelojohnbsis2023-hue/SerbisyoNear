import React from "react";

const variants = {
  completed: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  awaiting: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
  open: "bg-orange-100 text-orange-700",
  review: "bg-slate-200 text-slate-700",
  resolved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-slate-100 text-slate-500",
  low: "bg-amber-100 text-amber-700",
  enhanced: "bg-teal-100 text-teal-700",
  neutral: "bg-slate-100 text-slate-600",
};

export default function Badge({ variant = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
}
