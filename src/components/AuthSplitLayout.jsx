import React from "react";

export default function AuthSplitLayout({ leftTitle, leftSubtitle, children }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-slate-50 to-teal-50">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left side branding panel */}
        <div className="relative hidden min-h-screen overflow-hidden lg:block">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1544986581-efac024faf62?q=80&w=1600&auto=format&fit=crop"
            alt="Metro Manila"
          />
          <div className="absolute inset-0 bg-teal-900/80" />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/85 via-teal-800/75 to-slate-900/80" />

          <div className="relative flex h-full min-h-screen flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
                SerbisyoNear
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
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl sm:p-8 lg:p-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}