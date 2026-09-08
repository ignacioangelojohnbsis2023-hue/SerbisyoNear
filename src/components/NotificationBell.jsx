import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

const TYPE_CONFIG = {
  booking_created:  { icon: "📋", color: "bg-blue-50 border-blue-100",   dot: "bg-blue-500"   },
  booking_accepted: { icon: "✅", color: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500" },
  booking_declined: { icon: "❌", color: "bg-rose-50 border-rose-100",    dot: "bg-rose-500"   },
  booking_completed:{ icon: "🎉", color: "bg-teal-50 border-teal-100",    dot: "bg-teal-500"   },
  provider_approved:{ icon: "🌟", color: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500" },
  provider_rejected:{ icon: "⚠️", color: "bg-amber-50 border-amber-100",  dot: "bg-amber-500"  },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ userId, light = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const intervalRef = useRef(null);

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const role = currentUser?.role || "resident";

  function getRedirectUrl(notification) {
    const map = {
      resident: {
        booking_created: "/resident/bookings",
        booking_accepted: "/resident/bookings",
        booking_declined: "/resident/bookings",
        booking_completed: "/resident/bookings",
        chat_message: "/resident/bookings",
        provider_approved: "/resident/profile",
        provider_rejected: "/resident/find",
      },
      pro: {
        booking_created: "/pro/requests",
        booking_accepted: "/pro/jobs",
        booking_declined: "/pro/requests",
        booking_completed: "/pro/jobs",
        chat_message: "/pro/jobs",
        provider_approved: "/pro/profile",
        provider_rejected: "/pro/profile",
      },
      admin: {
        booking_created: "/admin/bookings",
        booking_accepted: "/admin/bookings",
        booking_declined: "/admin/bookings",
        booking_completed: "/admin/bookings",
        chat_message: "/admin/bookings",
        provider_approved: "/admin/providers",
        provider_rejected: "/admin/providers",
      },
    };

    const defaultMap = {
      resident: "/resident",
      pro: "/pro",
      admin: "/admin",
    };

    return map[role]?.[notification?.type] || defaultMap[role] || "/";
  }

  function buildRedirectUrl(notification) {
    const base = getRedirectUrl(notification);
    const bookingId = notification?.related_booking_id;
    if (!bookingId) return base;

    const params = new URLSearchParams();
    params.set("booking_id", String(bookingId));
    if (notification?.type === "chat_message") params.set("chat", "1");

    return `${base}?${params.toString()}`;
  }

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${userId}`);
      const data = await res.json();
      if (data.status === "success") {
        setNotifications(data.notifications);
        setUnread(data.unread_count);
      }
    } catch (e) {
      console.error("Notification fetch error:", e);
    }
  }, [userId]);

  // Initial fetch + fast polling for near-real-time updates
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleOpen() {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth - 16, 320);
      const left = Math.min(
        Math.max(8, rect.left + rect.width / 2 - panelWidth / 2),
        window.innerWidth - panelWidth - 8
      );
      setPanelPos({
        top: Math.min(rect.bottom + 8, window.innerHeight - 260),
        left,
      });
    }
    setOpen((prev) => !prev);
  }

  async function markAllRead() {
    if (unread === 0) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${userId}/read-all`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (e) {
      console.error(e);
    }
  }

  async function markOneRead(notifId) {
    try {
      await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  }

  const panel = open && createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-[calc(100vw-16px)] max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden sm:w-80"
      style={{ top: panelPos.top, left: panelPos.left, maxHeight: "480px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">Notifications</span>
          {unread > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-teal-700 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-2 text-3xl">🔔</div>
            <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">We'll let you know when something happens.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG["booking_created"];
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markOneRead(n.id);
                  const target = buildRedirectUrl(n);
                  setOpen(false);
                  navigate(target);
                }}
                className={[
                  "w-full text-left px-4 py-3 border-b border-slate-50 transition hover:bg-slate-50",
                  !n.is_read ? "bg-slate-50/80" : "bg-white",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border text-base ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-xs font-bold ${n.is_read ? "text-slate-600" : "text-slate-900"}`}>
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                      {n.message}
                    </p>
                    <span className="mt-1 text-[10px] text-slate-400">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={bellRef}
        onClick={handleOpen}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition ${
          light
            ? "border border-[#E9E2D2] bg-white text-[#3C463F] hover:bg-[#FAF6EE]"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
        title="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {panel}
    </div>
  );
}
