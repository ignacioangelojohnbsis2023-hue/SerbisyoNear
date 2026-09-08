import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleHelp, LogOut, Settings, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

const PROFILE_PATHS = {
  Resident: "/resident/profile",
  Pro: "/pro/profile",
  Admin: "/admin",
};

const SETTINGS_PATHS = {
  Resident: "/resident/settings",
  Pro: "/pro/settings",
  Admin: "/admin/settings",
};

export default function AccountMenu({ user, role = "Resident", onHelpSupport }) {
  const [displayUser, setDisplayUser] = useState(user);
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const profilePath = PROFILE_PATHS[role] || PROFILE_PATHS.Resident;
  const settingsPath = SETTINGS_PATHS[role] || SETTINGS_PATHS.Resident;

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  useEffect(() => {
    function syncUser(event) {
      const nextUser = event.detail || JSON.parse(localStorage.getItem("user") || "null");
      if (nextUser) setDisplayUser(nextUser);
    }

    window.addEventListener("serbisyonear-user-updated", syncUser);
    return () => window.removeEventListener("serbisyonear-user-updated", syncUser);
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  function logout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-2xl p-0.5 text-slate-600 hover:bg-white"
      >
        <Avatar name={displayUser?.full_name} photoUrl={displayUser?.profile_picture} size="sm" />
        <ChevronDown size={15} className={`hidden transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-[#E9E2D2] bg-white p-2 shadow-xl">
          <div className="border-b border-[#E9E2D2] px-3 pb-3 pt-2">
            <p className="truncate text-sm font-bold text-slate-900">{displayUser?.full_name || "Account"}</p>
            <p className="truncate text-xs text-slate-500">{displayUser?.email || ""}</p>
          </div>

          <div className="pt-2">
            <button type="button" onClick={() => { setOpen(false); navigate(profilePath); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-[#FAF6EE]">
              <UserRound size={17} className="text-teal-700" />
              Profile
            </button>
            <button type="button" onClick={() => { setOpen(false); navigate(settingsPath); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-[#FAF6EE]">
              <Settings size={17} className="text-teal-700" />
              Settings
            </button>
            <button type="button" onClick={() => { setOpen(false); onHelpSupport ? onHelpSupport() : navigate(`${profilePath}?section=help`); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-[#FAF6EE]">
              <CircleHelp size={17} className="text-teal-700" />
              Help &amp; Support
            </button>
            <button type="button" onClick={() => { setOpen(false); setLogoutOpen(true); }} className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-[#E9E2D2] px-3 py-2.5 pt-3 text-left text-sm font-semibold text-[#D9694E] hover:bg-[#F7E4DD]">
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      )}

      {logoutOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="font-display text-lg font-bold text-slate-900">Log out?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">You can sign back in anytime to continue using SerbisyoNear.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setLogoutOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button>
              <button type="button" onClick={logout} className="flex-1 rounded-xl bg-[#D9694E] px-4 py-3 text-sm font-semibold text-white">Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
