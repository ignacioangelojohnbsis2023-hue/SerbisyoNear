import React, { useEffect, useState } from "react";
import ProLayout from "../components/ProLayout";
import { API_BASE_URL } from "../lib/api";

const paymentBadge = (ps) => {
  if (ps === "paid")    return "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700";
  if (ps === "pending") return "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700";
  return "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500";
};

export default function ProEarnings() {
  const [summary, setSummary] = useState({
    total_completed_jobs: 0,
    total_earnings: 0,
    pending_earnings: 0,
    pending_jobs: 0,
  });
  const [history, setHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("paid"); // paid | pending

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (!user?.id) return;

        const res = await fetch(`${API_BASE_URL}/pro/earnings/${user.id}`);
        const data = await res.json();

        if (data.status === "success") {
          setSummary(data.summary);
          setHistory(data.history || []);
          setPendingPayments(data.pending_payments || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  const displayList = activeTab === "paid" ? history : pendingPayments;

  return (
    <ProLayout title="Pro">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Earnings</h1>
          <p className="mt-1 text-sm text-slate-500">Track your confirmed payments and pending collections.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="relative overflow-hidden rounded-2xl bg-teal-700 p-6 text-white shadow-sm">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="text-xs font-bold uppercase tracking-widest text-teal-100">Total Earned</div>
            <div className="mt-2 text-3xl font-extrabold">
              {loading ? "..." : `₱${summary.total_earnings.toLocaleString()}`}
            </div>
            <div className="mt-1 text-xs text-teal-200">From paid bookings</div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-amber-500 p-6 text-white shadow-sm">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="text-xs font-bold uppercase tracking-widest text-amber-100">Pending Collection</div>
            <div className="mt-2 text-3xl font-extrabold">
              {loading ? "..." : `₱${(summary.pending_earnings || 0).toLocaleString()}`}
            </div>
            <div className="mt-1 text-xs text-amber-100">Awaiting resident payment</div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-blue-600 p-6 text-white shadow-sm">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="text-xs font-bold uppercase tracking-widest text-blue-100">Completed Jobs</div>
            <div className="mt-2 text-3xl font-extrabold">
              {loading ? "..." : summary.total_completed_jobs}
            </div>
            <div className="mt-1 text-xs text-blue-200">Paid & confirmed</div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-slate-700 p-6 text-white shadow-sm">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="text-xs font-bold uppercase tracking-widest text-slate-300">Awaiting Payment</div>
            <div className="mt-2 text-3xl font-extrabold">
              {loading ? "..." : summary.pending_jobs || 0}
            </div>
            <div className="mt-1 text-xs text-slate-400">Jobs not yet paid</div>
          </div>

        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("paid")}
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold transition",
              activeTab === "paid"
                ? "bg-teal-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            ✓ Paid ({history.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold transition",
              activeTab === "pending"
                ? "bg-amber-500 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            ⏳ Pending ({pendingPayments.length})
          </button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading earnings...</div>
          ) : displayList.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl mb-2">{activeTab === "paid" ? "💰" : "⏳"}</div>
              <p className="text-sm font-semibold text-slate-500">
                {activeTab === "paid" ? "No paid earnings yet." : "No pending payments."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                    <th className="px-5 py-3 font-semibold">#</th>
                    <th className="px-5 py-3 font-semibold">Service</th>
                    <th className="px-5 py-3 font-semibold">Resident</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">#{b.id}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{b.service_name}</td>
                      <td className="px-5 py-4 text-slate-600">{b.resident_name}</td>
                      <td className="px-5 py-4 text-slate-600">{b.booking_date}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        ₱{(b.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={paymentBadge(b.payment_status)}>
                          {b.payment_status === "paid" && "✓ Paid"}
                          {b.payment_status === "pending" && "⏳ Pending"}
                          {(!b.payment_status || b.payment_status === "unpaid") && "Unpaid"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </ProLayout>
  );
}
