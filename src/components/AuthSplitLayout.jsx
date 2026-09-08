import React from "react";

export default function AuthSplitLayout({ leftTitle, leftSubtitle, children }) {
  return (
    <div className="min-h-screen w-full bg-[#FAF6EE]">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left side branding panel */}
        <div className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#0F6B5C] to-[#14213D] lg:block">
          <div className="relative flex h-full min-h-screen flex-col justify-between p-12 xl:p-16">
          <div>
            <div className="inline-flex items-center gap-3 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A623] font-display text-lg font-extrabold text-[#14213D]">S</span>
              <span className="font-display text-xl font-bold">SerbisyoNear</span>
            </div>

              <div className="mt-10 max-w-xl text-white">
                <h1 className="text-5xl font-extrabold leading-tight">
                  {leftTitle}
                </h1>
                <p className="mt-5 text-lg leading-8 text-white/85">
                  {leftSubtitle}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-white">Fast</div>
                <div className="mt-1 text-sm text-white/80">
                  Quick booking and account access
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-white">Safe</div>
                <div className="mt-1 text-sm text-white/80">
                  Verified providers and protected flows
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-extrabold text-white">Local</div>
                <div className="mt-1 text-sm text-white/80">
                  Services built for Metro Manila communities
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side form area */}
        <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="rounded-[2rem] border border-[#E9E2D2] bg-white p-6 shadow-xl sm:p-8 lg:p-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}