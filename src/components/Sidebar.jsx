import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const residentNav = [
  { label: "Dashboard", to: "/resident" },
  { label: "Find Services", to: "/resident/find" },
  { label: "My Bookings", to: "/resident/bookings" },
  { label: "Profile", to: "/resident/profile" },
];

const proNav = [
  { label: "Dashboard", to: "/pro" },
  { label: "Job Requests", to: "/pro/requests" },
  { label: "My Jobs", to: "/pro/jobs" },
  { label: "Earnings", to: "/pro/earnings" },
  { label: "Profile", to: "/pro/profile" },
];

const adminNav = [
  { label: "Dashboard", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Providers", to: "/admin/providers" },
  { label: "Bookings", to: "/admin/bookings" },
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
      <aside className="fixed top-0 left-0 h-screen w-64 flex flex-col bg-slate-900 text-white">
        {/* Logo + Bell row */}
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">SerbisyoNear</div>
              <div className="mt-1 text-xs text-white/70">{title} Dashboard</div>
            </div>
            {currentUser?.id && (
              <NotificationBell userId={currentUser.id} />
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "block rounded-lg px-4 py-3 text-sm transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15"
          >
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
