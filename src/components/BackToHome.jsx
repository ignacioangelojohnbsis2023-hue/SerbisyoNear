import React from "react";
import { Link } from "react-router-dom";

export default function BackToHome() {
  return (
    <div className="mb-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 hover:shadow"
      >
        <span>←</span>
        <span>Back to Home</span>
      </Link>
    </div>
  );
}