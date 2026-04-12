import React from "react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 py-12">
      <div className="mx-auto w-full max-w-6xl px-6 text-center">
        <div className="text-lg font-extrabold text-teal-500">SerbisyoNear</div>
        <div className="mt-2 text-sm text-slate-400">
          Connecting Metro Manila with trusted household and maintenance services
        </div>
        <div className="mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} SerbisyoNear. University of Caloocan City
        </div>
      </div>
    </footer>
  );
}
