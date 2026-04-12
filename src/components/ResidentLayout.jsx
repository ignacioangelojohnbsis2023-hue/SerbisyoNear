import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function ResidentLayout({ title, topRight, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden w-64 shrink-0 lg:block">
          <Sidebar title="Resident" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw]">
              <Sidebar title="Resident" />
            </div>
          </div>
        )}

        {/* Right Panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <div className="sticky top-0 z-30 border-b border-slate-100 bg-white px-4 py-4 sm:px-6 lg:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {/* Mobile Menu Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                >
                  <span className="text-lg">☰</span>
                </button>

                <div>
                  <div className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {title}
                  </div>
                </div>
              </div>

              {topRight ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {topRight}
                </div>
              ) : null}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}