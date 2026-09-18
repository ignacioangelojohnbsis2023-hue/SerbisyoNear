import React from "react";
import { Link, useLocation } from "react-router-dom";
import { isNavigationActive, navigationByRole } from "./navigation";

export default function BottomNav({ role = "Resident" }) {
  const location = useLocation();
  const items = navigationByRole[role] || navigationByRole.Resident;
  return (
    <nav aria-label={`${role} mobile navigation`} className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E2D2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-10px_rgba(20,30,25,.18)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1.5 py-2">
        {items.filter((item) => item.mobile !== false).slice(0, 5).map((item) => {
          const active = isNavigationActive(location.pathname, item.to);
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[#A6AEA1] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 ${active ? "text-[#0F6B5C]" : ""}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-[#EFF6F4] text-[#0F6B5C]" : "text-[#A6AEA1]"}`}>
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={`text-[10.5px] font-semibold ${active ? "text-[#0F6B5C]" : "text-[#A6AEA1]"}`}>{item.mobileLabel || item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
