import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ClipboardList, Home, LayoutGrid, LogOut, Search, User, Users, Wallet, Wrench } from "lucide-react";

const residentNav = [
  { label: "Dashboard", to: "/resident", icon: Home },
  { label: "Find Services", to: "/resident/find", icon: Search },
  { label: "My Bookings", to: "/resident/bookings", icon: CalendarDays },
  { label: "Profile", to: "/resident/profile", icon: User },
];

const proNav = [
  { label: "Dashboard", to: "/pro", icon: Home },
  { label: "Job Requests", to: "/pro/requests", icon: ClipboardList },
  { label: "My Jobs", to: "/pro/jobs", icon: Wrench },
  { label: "Wallet", to: "/pro/wallet", icon: Wallet },
  { label: "Profile", to: "/pro/profile", icon: User },
];

const adminNav = [
  { label: "Dashboard", to: "/admin", icon: Home },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Providers", to: "/admin/providers", icon: LayoutGrid },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarDays },
];

export default function Sidebar({ title = "Resident" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Get current user id for notifications
  const rawUser = localStorage.getItem("user");
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  let items = residentNav;
  if (title === "Pro") items = proNav;
  if (title === "Admin") items = adminNav;

  function handleLogoutConfirm() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen w-[252px] flex flex-col bg-gradient-to-b from-navy-900 to-navy-800 px-5 py-7 text-white">
        {/* Logo + Bell row */}
        <div className="border-b border-white/10 px-1 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-gold-500 to-teal-500 font-display text-[17px] font-extrabold text-navy-900">S</div>
              <div>
                <div className="font-display text-[16.5px] font-bold leading-tight">SerbisyoNear</div>
                <div className="mt-0.5 text-[11.5px] tracking-wide text-[#8FA0C7]">{title} Dashboard</div>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = item.to === `/${title.toLowerCase()}`
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-[14.5px] transition",
                  active
                    ? "bg-gold-500/15 text-gold-500"
                    : "text-[#B7C4E3] hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left text-sm font-medium text-[#8FA0C7] transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Log out?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to log out of your account?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
