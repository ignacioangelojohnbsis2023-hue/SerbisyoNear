import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../lib/api";

const INITIAL_REPORTS = {
  summary: {
    total_bookings: 0,
    total_completed: 0,
    total_pending: 0,
    total_confirmed: 0,
    total_cancelled: 0,
    total_revenue: 0,
    pending_revenue: 0,
  },
  top_services: [],
  distribution: [],
};

function formatCurrency(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

export default function AdminReports() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/admin/reports`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.status === "success") setReports({
          summary: { ...INITIAL_REPORTS.summary, ...(data.summary || {}) },
          top_services: data.top_services || [],
          distribution: data.distribution || [],
        });
        else setErrorMessage(data.message || "Failed to load reports.");
      })
      .catch(() => {
        if (!cancelled) setErrorMessage("Something went wrong while loading reports.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const summaryCards = [
    ["Total Bookings", reports.summary.total_bookings, "text-slate-900"],
    ["Completed", reports.summary.total_completed, "text-emerald-700"],
    ["Pending", reports.summary.total_pending, "text-amber-700"],
    ["Confirmed", reports.summary.total_confirmed, "text-blue-700"],
    ["Revenue", formatCurrency(reports.summary.total_revenue), "text-teal-700"],
    [
      "Pending Revenue",
      formatCurrency(reports.summary.pending_revenue),
      reports.summary.pending_revenue > 0 ? "text-orange-700" : "text-slate-900",
    ],
  ];

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Overview of bookings, service demand, and revenue.</p>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading reports...</div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {summaryCards.map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className={`mt-2 text-xl font-extrabold ${color}`}>{value}</p>
                </div>
              ))}
            </section>

            <section className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-stretch">
              <div className="min-h-[320px] min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">Booking distribution</h2>
                <div className="mt-5 space-y-4">
                  {reports.distribution.length === 0 ? (
                    <p className="text-sm text-slate-400">No booking data yet.</p>
                  ) : reports.distribution.map((item) => {
                    const total = reports.summary.total_bookings || 1;
                    const percentage = Math.round((item.value / total) * 100);
                    return (
                      <div key={item.label}>
                        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="whitespace-nowrap text-right" style={{ color: item.color || undefined }}>{item.value} ({percentage}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-[320px] min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">Top services</h2>
                {reports.top_services.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-400">No service bookings yet.</p>
                ) : (
                  <div className="mt-4 divide-y divide-slate-100">
                    {reports.top_services.map((service, index) => (
                      <div key={service.service_name} className="flex min-w-0 items-start justify-between gap-2 py-3 sm:gap-4">
                        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{index + 1}</span>
                          <span className="min-w-0 break-words text-sm font-semibold leading-snug text-slate-700" title={service.service_name}>{service.service_name}</span>
                        </div>
                        <span className="max-w-[88px] shrink-0 text-right text-xs font-bold leading-snug text-slate-900 sm:max-w-none sm:text-sm">{service.count} bookings</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
