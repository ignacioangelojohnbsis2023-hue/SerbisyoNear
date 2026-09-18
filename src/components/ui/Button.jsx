import React from "react";

const variants = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-200",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-200",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200",
};

const sizes = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
