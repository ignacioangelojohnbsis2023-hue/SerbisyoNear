import React from "react";

export default function Toast({ message, type = "success", onClose }) {
  const bg =
    type === "success"
      ? "bg-emerald-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-slate-800";

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`${bg} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-4`}
      >
        <span className="text-sm font-semibold">{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}