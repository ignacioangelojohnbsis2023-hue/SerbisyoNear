import React from "react";

export default function Input({ label, error, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="text-sm font-semibold text-slate-700">{label}</span>}
      <input
        {...props}
        className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100 ${error ? "border-red-400" : "border-slate-200"} ${className}`}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
