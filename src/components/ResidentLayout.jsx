import React, { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";
import SupportChatbot from "./SupportChatbot";

export default function ResidentLayout({ title, topRight, headerEyebrow = "Account", headerSubtitle, children }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden w-64 shrink-0 lg:block">
          <Sidebar title="Resident" />
        </div>

        {/* Right Panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <div className="sticky top-0 z-30 bg-cream-100 px-5 pt-5 pb-3 sm:px-6 lg:px-9 lg:bg-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                  {title === "Dashboard" ? "Good morning" : headerEyebrow}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                    {title === "Dashboard"
                      ? `Kumusta, ${currentUser?.full_name?.split(" ")[0] || "there"} 👋`
                      : title}
                  </div>
                  {headerSubtitle && <div className="mt-1 text-sm text-slate-500">{headerSubtitle}</div>}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {topRight}
                {currentUser?.id && (
                  <div className="rounded-full bg-white p-1 shadow-sm">
                    <NotificationBell userId={currentUser.id} light />
                  </div>
                )}
                <AccountMenu user={currentUser} role="Resident" onHelpSupport={() => setSupportOpen(true)} />
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <main className="flex-1 px-5 pb-24 sm:px-6 lg:px-9 lg:pb-10">
            {children}
          </main>
        </div>
      </div>

      <BottomNav role="Resident" />
      <SupportChatbot open={supportOpen} onClose={() => setSupportOpen(false)} role="Resident" />
    </div>
  );
}