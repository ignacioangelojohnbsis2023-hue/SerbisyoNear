import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

// Reads the logged-in user from localStorage (set during login / profile update)
function useCurrentUser() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });

  // Re-read when the storage event fires (e.g. profile picture updated in
  // another tab, or after upload on the same page via dispatchEvent)
  useEffect(() => {
    function onStorage() {
      try { setUser(JSON.parse(localStorage.getItem("user") || "null")); }
      catch { setUser(null); }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return user;
}

// Small avatar shown in the top-right when the user is logged in
function NavAvatar({ user }) {
  const navigate = useNavigate();

  const profilePath =
    user.role === "resident" ? "/residentprofile" :
    user.role === "pro"      ? "/proprofile"      :
    user.role === "admin"    ? "/adminprofile"    : null;

  // Build the full image URL (backend serves /uploads/... as static files)
  const backendBase = API_BASE_URL.replace("/api", "");
  const photoUrl = user.profile_picture
    ? `${backendBase}${user.profile_picture}`
    : null;

  return (
    <button
      onClick={() => profilePath && navigate(profilePath)}
      title={`${user.full_name} — Go to profile`}
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 shadow-sm transition hover:border-teal-400 hover:shadow-md"
    >
      {/* Avatar circle */}
      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
        {photoUrl ? (
          <img src={photoUrl} alt={user.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-teal-700 text-xs font-bold text-white">
            {getInitials(user.full_name)}
          </div>
        )}
      </div>

      {/* Name (hidden on small screens) */}
      <span className="hidden text-sm font-semibold text-slate-700 sm:block max-w-[120px] truncate">
        {user.full_name}
      </span>
    </button>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Re-render when profile_picture is saved from the same tab
  // (localStorage.setItem doesn't fire the "storage" event in the same tab,
  // so profile pages dispatch a custom event after uploading)
  useEffect(() => {
    function onProfileUpdated() {
      // Force re-read — the hook will update via state
      window.dispatchEvent(new Event("storage"));
    }
    window.addEventListener("profileUpdated", onProfileUpdated);
    return () => window.removeEventListener("profileUpdated", onProfileUpdated);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-extrabold text-slate-900">
          SerbisyoNear
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#services" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            Services
          </a>
          <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-teal-700">
            Testimonials
          </a>

          {user ? (
            /* Logged-in: show avatar button */
            <NavAvatar user={user} />
          ) : (
            /* Logged-out: show Login + Sign Up */
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-teal-700">
                Login
              </Link>
              <button
                onClick={() => navigate("/signup")}
                className="rounded-full bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Sign Up
              </button>
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="md:hidden">
          {user ? (
            <NavAvatar user={user} />
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
