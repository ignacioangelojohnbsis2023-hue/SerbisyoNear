import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Calendar, User, Users, Briefcase, Wallet, ClipboardList, LayoutGrid } from "lucide-react";

const residentNav = [
  { label: "Home", to: "/resident", icon: Home },
  { label: "Services", to: "/resident/find", icon: Search },
  { label: "Bookings", to: "/resident/bookings", icon: Calendar },
  { label: "Profile", to: "/resident/profile", icon: User },
];

const proNav = [
  { label: "Home", to: "/pro", icon: Home },
  { label: "Requests", to: "/pro/requests", icon: ClipboardList },
  { label: "Jobs", to: "/pro/jobs", icon: Briefcase },
  { label: "Wallet", to: "/pro/wallet", icon: Wallet },
  { label: "Profile", to: "/pro/profile", icon: User },
];

const adminNav = [
  { label: "Home", to: "/admin", icon: Home },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Providers", to: "/admin/providers", icon: LayoutGrid },
  { label: "Bookings", to: "/admin/bookings", icon: Calendar },
];

export default function BottomNav({ role = "Resident" }) {
  const location = useLocation();
  let items = residentNav;
  if (role === "Pro") items = proNav;
  if (role === "Admin") items = adminNav;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E2D2] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-10px_rgba(20,30,25,.18)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1.5 py-2">
        {items.map((item) => {
          const active = item.to === "/pro" || item.to === "/resident" || item.to === "/admin"
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[#A6AEA1] transition"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                  active ? "bg-[#EFF6F4] text-[#0F6B5C]" : "text-[#A6AEA1]"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={`text-[10.5px] font-semibold ${active ? "text-[#0F6B5C]" : "text-[#A6AEA1]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
