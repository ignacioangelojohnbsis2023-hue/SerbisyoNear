import React from "react";
import { API_BASE_URL } from "../lib/api";

const GRADIENTS = [
  "from-teal-500 to-emerald-600",
  "from-amber-500 to-orange-600",
  "from-indigo-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function gradientFor(seed) {
  if (!seed) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/**
 * Shared initials/photo avatar used across the app (headers, lists, chat).
 * Renders a photo if `photoUrl` is provided, otherwise a gradient initials badge.
 */
export default function Avatar({ name, photoUrl, size = "md", className = "" }) {
  const initials = name
    ? name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";

  const sizeCls = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-16 w-16 text-xl",
  }[size] || size;

  const src = photoUrl
    ? (photoUrl.startsWith("http") ? photoUrl : `${API_BASE_URL}${photoUrl}`)
    : null;

  return (
    <div className={`flex-shrink-0 rounded-2xl overflow-hidden shadow-sm ${sizeCls} ${className}`}>
      {src ? (
        <img src={src} alt={name || "User"} className="h-full w-full object-cover" />
      ) : (
        <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br font-bold text-white ${gradientFor(name)}`}>
          {initials}
        </div>
      )}
    </div>
  );
}
