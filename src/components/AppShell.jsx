import React, { useState } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import NotificationBell from "./NotificationBell";
import AccountMenu from "./AccountMenu";
import SupportChatbot from "./SupportChatbot";

export default function AppShell({ role, title, topRight, headerEyebrow, headerSubtitle, children }) {
  const [supportOpen, setSupportOpen] = useState(false);
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();
  const displayTitle = role === "Resident" && title === "Dashboard"
    ? `Kumusta, ${currentUser?.full_name?.split(" ")[0] || "there"} 👋`
    : title;

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream-100">
      <div className="flex min-h-screen w-full">
        <div className="hidden w-[252px] shrink-0 lg:block"><Sidebar title={role} /></div>
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-30 bg-cream-100 px-5 pb-3 pt-5 sm:px-6 lg:bg-transparent lg:px-9">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{headerEyebrow}</div>
                <div className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">{displayTitle}</div>
                {headerSubtitle && <div className="mt-1 text-sm text-slate-500">{headerSubtitle}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {topRight}
                {currentUser?.id && <div className="rounded-full bg-white p-1 shadow-sm"><NotificationBell userId={currentUser.id} light /></div>}
                <AccountMenu user={currentUser} role={role} onHelpSupport={() => setSupportOpen(true)} />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-5 pb-24 sm:px-6 lg:px-9 lg:pb-10">{children}</main>
        </div>
      </div>
      <BottomNav role={role} />
      <SupportChatbot open={supportOpen} onClose={() => setSupportOpen(false)} role={role} />
    </div>
  );
}
