import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../lib/api";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-slate-200"}>★</span>
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // "all" | "complaints" | "feedback"
  const [archivingId, setArchivingId] = useState(null);

  async function fetchFeedbacks(filterTab = "all") {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/admin/feedbacks`;
      if (filterTab === "complaints") url += "?is_complaint=true";
      else if (filterTab === "feedback") url += "?is_complaint=false";
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") {
        setFeedbacks(data.feedbacks);
      } else {
        alert(data.message || "Failed to load feedbacks.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong while loading feedbacks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchFeedbacks(tab); }, [tab]);

  async function handleArchive(id) {
    if (!window.confirm("Archive this feedback? It will be hidden from this list.")) return;
    try {
      setArchivingId(id);
      const res = await fetch(`${API_BASE_URL}/admin/feedbacks/${id}/archive`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success") {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      } else {
        alert(data.message || "Failed to archive feedback.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong.");
    } finally {
      setArchivingId(null);
    }
  }

  function formatDate(str) {
    if (!str) return "-";
    try {
      return new Date(str).toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return str; }
  }

  const tabs = [
    { key: "all", label: "All" },
    { key: "complaints", label: "🚨 Complaints" },
    { key: "feedback", label: "⭐ Feedback" },
  ];

  const complaintCount = feedbacks.filter((f) => f.is_complaint).length;

  return (
    <AdminLayout title="Feedback & Complaints">
      <div className="space-y-5">

        {/* Header */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Feedback & Complaints</h2>
              <p className="mt-2 text-slate-500">
                Review ratings, comments, and complaints submitted by residents.
              </p>
            </div>
            {complaintCount > 0 && (
              <div className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600">
                🚨 {complaintCount} complaint{complaintCount > 1 ? "s" : ""} need attention
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-5 flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === t.key
                    ? "bg-teal-700 text-white shadow"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-slate-500">Loading feedbacks...</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-slate-500">No feedbacks found.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className={`rounded-2xl border p-5 ${
                    fb.is_complaint
                      ? "border-red-100 bg-red-50"
                      : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      {/* Complaint badge */}
                      {fb.is_complaint && (
                        <span className="mb-2 inline-block rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-600">
                          🚨 Complaint
                        </span>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={fb.rating} />
                        <span className="text-sm font-bold text-slate-700">{fb.rating}/5</span>
                      </div>

                      {/* Comment */}
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {fb.comment || <span className="text-slate-400 italic">No comment provided.</span>}
                      </p>

                      {/* Meta */}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>📋 Booking #{fb.booking_id}</span>
                        <span>👤 Resident: <span className="font-semibold text-slate-700">{fb.resident_name}</span></span>
                        <span>🔧 Provider: <span className="font-semibold text-slate-700">{fb.provider_name}</span></span>
                        <span>🕐 {formatDate(fb.created_at)}</span>
                      </div>
                    </div>

                    {/* Archive action */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleArchive(fb.id)}
                        disabled={archivingId === fb.id}
                        className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        {archivingId === fb.id ? "Archiving..." : "Archive"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
