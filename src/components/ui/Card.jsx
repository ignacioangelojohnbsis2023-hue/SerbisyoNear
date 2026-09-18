import React from "react";

export default function Card({ className = "", children, ...props }) {
  return (
    <div {...props} className={`rounded-3xl border border-slate-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
