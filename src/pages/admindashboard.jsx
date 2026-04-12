import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../lib/api";

const DOC_TYPE_LABELS = {
  government_id: "Government-Issued ID",
  diploma: "Diploma / Academic Certificate",
  certificate: "Skills / Trade Certificate",
  other: "Other Document",
};

function getStatusBadge(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "pending")  return "bg-amber-100 text-amber-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data, size = 200 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0)
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50">
        <p className="text-sm text-slate-400">No booking data yet.</p>
      </div>
    );
  const radius = 70;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const slices = data.map((d) => {
    const dash = (d.value / total) * circumference;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  });
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth="26" />
          {slices.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={s.color} strokeWidth="26"
              strokeDasharray={`${s.dash} ${circumference - s.dash}`} strokeDashoffset={-s.offset} strokeLinecap="butt" />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900">{total}</span>
          <span className="text-xs font-medium text-slate-400">total</span>
        </div>
      </div>
      <div className="w-full space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-slate-600">{d.label}</span>
            </div>
            <span className="font-semibold text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function ServiceBarChart({ data, total }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#ea580c"];
  return (
    <div className="space-y-4">
      {data.map((d, i) => {
        const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
        return (
          <div key={i}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm font-semibold text-slate-700">{d.service_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{pct}%</span>
                <span className="text-sm font-extrabold text-slate-900">{d.count}</span>
              </div>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(d.count / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon, loading }) {
  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm animate-pulse ${accent}`}>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-2 h-16 w-16 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-24 rounded bg-white/30" />
            <div className="h-9 w-16 rounded bg-white/30" />
            <div className="h-3 w-32 rounded bg-white/20" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/20" />
        </div>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-sm transition hover:shadow-md ${accent}`}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-2 h-16 w-16 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</div>
          <div className="mt-2 text-4xl font-extrabold">{value}</div>
          {sub && <div className="mt-2 text-xs opacity-70">{sub}</div>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">{icon}</div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0, total_residents: 0, total_pros: 0, total_admins: 0, pending_verifications: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingPros, setPendingPros] = useState([]);
  const [reports, setReports] = useState({
    summary: { total_bookings:0, total_completed:0, total_pending:0, total_confirmed:0, total_cancelled:0, total_revenue:0, pending_revenue:0 },
    topServices: [], distribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Credentials modal state
  const [credModal, setCredModal] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  async function openCredentials(pro) {
    setCredModal(pro);
    setDocs([]);
    setDocsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/providers/${pro.id}/documents`);
      const data = await res.json();
      if (data.status === "success") setDocs(data.documents);
    } catch { /* ignore */ }
    setDocsLoading(false);
  }

  async function handleApprove(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/providers/${userId}/approve`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success") {
        setPendingPros(prev => prev.filter(p => p.id !== userId));
        setStats(prev => ({ ...prev, pending_verifications: Math.max(0, prev.pending_verifications - 1) }));
        if (credModal?.id === userId) setCredModal(null);
      } else alert(data.message || "Failed to approve.");
    } catch { alert("Something went wrong."); }
  }

  async function handleReject(userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/providers/${userId}/reject`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success") {
        setPendingPros(prev => prev.filter(p => p.id !== userId));
        setStats(prev => ({ ...prev, pending_verifications: Math.max(0, prev.pending_verifications - 1) }));
        if (credModal?.id === userId) setCredModal(null);
      } else alert(data.message || "Failed to reject.");
    } catch { alert("Something went wrong."); }
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, usersRes, prosRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/stats`),
          fetch(`${API_BASE_URL}/admin/recent-users`),
          fetch(`${API_BASE_URL}/admin/pending-pros`),
          fetch(`${API_BASE_URL}/admin/reports`),
        ]);
        const [statsData, usersData, prosData, reportsData] = await Promise.all([
          statsRes.json(), usersRes.json(), prosRes.json(), reportsRes.json(),
        ]);
        if (statsData.status === "success") setStats(statsData.stats);
        if (usersData.status === "success") setRecentUsers(usersData.users);
        if (prosData.status === "success") setPendingPros(prosData.providers);
        if (reportsData.status === "success") setReports({
          summary: reportsData.summary,
          topServices: reportsData.top_services || [],
          distribution: reportsData.distribution || [],
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); setReportsLoading(false); }
    }
    fetchAll();
  }, []);

  function getRoleBadge(role) {
    if (role === "admin") return "bg-purple-100 text-purple-700";
    if (role === "pro") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  }

  return (
    <AdminLayout title="Dashboard"
      topRight={
        <a href="/admin/users" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition">
          Manage System
        </a>
      }
    >
      <div className="space-y-6">

        {/* KPI Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard loading={loading} label="Total Users" value={stats.total_users}
            sub={`${stats.total_residents} residents · ${stats.total_pros} providers`}
            accent="bg-teal-700"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6 3 3 0 000 6zM3 14a3 3 0 100-6 3 3 0 000 6z" /></svg>}
          />
          <KpiCard loading={reportsLoading} label="Total Revenue"
            value={`₱${(reports.summary.total_revenue || 0).toLocaleString()}`}
            sub={
              !reportsLoading && (reports.summary.pending_revenue || 0) > 0
                ? `+ ₱${(reports.summary.pending_revenue || 0).toLocaleString()} pending payment`
                : "From paid bookings"
            }
            accent="bg-emerald-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard loading={reportsLoading} label="Total Bookings" value={reports.summary.total_bookings}
            sub={`${reports.summary.total_completed} completed · ${reports.summary.total_pending} pending`}
            accent="bg-blue-600"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <KpiCard loading={loading} label="Pending Verifications" value={stats.pending_verifications}
            sub="Providers awaiting review" accent="bg-amber-500"
            icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Booking Distribution</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">All time</span>
            </div>
            <p className="mb-6 text-sm text-slate-500">Breakdown of all bookings by status.</p>
            {reportsLoading ? (
              <div className="flex h-48 items-center justify-center"><p className="text-sm text-slate-400">Loading...</p></div>
            ) : <DonutChart data={reports.distribution} />}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Top Services</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">By bookings</span>
            </div>
            <p className="mb-6 text-sm text-slate-500">Most booked services on the platform.</p>
            {reportsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between mb-1.5"><div className="h-3.5 w-32 rounded bg-slate-100" /><div className="h-3.5 w-10 rounded bg-slate-100" /></div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : reports.topServices.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50"><p className="text-sm text-slate-400">No service data yet.</p></div>
            ) : <ServiceBarChart data={reports.topServices} total={reports.summary.total_bookings} />}
          </div>
        </section>

        {/* Service Detail + Pending Pros */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Service Detail</h2>
                <p className="mt-0.5 text-sm text-slate-500">Full ranking of booked services.</p>
              </div>
              <a href="/admin/reports" className="text-sm font-semibold text-teal-700 hover:underline">View reports</a>
            </div>
            {reportsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-1 animate-pulse border-t border-slate-50">
                    <div className="h-4 w-4 rounded bg-slate-100" /><div className="h-4 flex-1 rounded bg-slate-100" />
                    <div className="h-4 w-8 rounded bg-slate-100" /><div className="h-2.5 w-28 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : reports.topServices.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50"><p className="text-sm text-slate-400">No service data yet.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                      <th className="pb-3 font-semibold">#</th>
                      <th className="pb-3 font-semibold">Service</th>
                      <th className="pb-3 font-semibold">Bookings</th>
                      <th className="pb-3 font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.topServices.map((item, index) => {
                      const share = reports.summary.total_bookings > 0 ? ((item.count / reports.summary.total_bookings) * 100).toFixed(1) : 0;
                      return (
                        <tr key={index} className="border-t border-slate-50 transition hover:bg-slate-50/60">
                          <td className="py-3 text-sm font-bold text-slate-300">{index + 1}</td>
                          <td className="py-3 font-semibold text-slate-800">{item.service_name}</td>
                          <td className="py-3 font-bold text-slate-700">{item.count}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${share}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Pending Pros — now with View Credentials button ── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pending Pros</h2>
                <p className="mt-0.5 text-sm text-slate-500">Review credentials before approving</p>
              </div>
              <a href="/admin/providers" className="text-sm font-semibold text-teal-700 hover:underline">Review all</a>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-full bg-slate-200 flex-shrink-0" />
                      <div className="space-y-1.5 flex-1"><div className="h-3.5 w-28 rounded bg-slate-200" /><div className="h-3 w-36 rounded bg-slate-200" /></div>
                    </div>
                    <div className="flex gap-2"><div className="h-8 flex-1 rounded-lg bg-slate-200" /><div className="h-8 flex-1 rounded-lg bg-slate-200" /></div>
                  </div>
                ))}
              </div>
            ) : pendingPros.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50">
                <div className="text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 mx-auto mb-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">All caught up</p>
                  <p className="text-xs text-slate-400 mt-1">No pending providers.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {pendingPros.map(pro => (
                  <div key={pro.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-teal-100 hover:shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white flex-shrink-0">
                        {pro.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{pro.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{pro.email}</p>
                      </div>
                    </div>
                    {/* View Credentials first, then approve/reject */}
                    <div className="flex flex-col gap-2">
                      <button onClick={() => openCredentials(pro)}
                        className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition">
                        📄 View Credentials
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(pro.id)}
                          className="flex-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition">
                          ✓ Approve
                        </button>
                        <button onClick={() => handleReject(pro.id)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Users */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Users</h2>
              <p className="mt-0.5 text-sm text-slate-500">Latest registered accounts on the platform.</p>
            </div>
            <a href="/admin/users" className="text-sm font-semibold text-teal-700 hover:underline">View all</a>
          </div>
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-t border-slate-50 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="h-4 w-36 rounded bg-slate-100" /><div className="h-5 w-16 rounded-full bg-slate-100" />
                  <div className="h-4 flex-1 rounded bg-slate-100" /><div className="h-5 w-14 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl bg-slate-50"><p className="text-sm text-slate-400">No users found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(user => (
                    <tr key={user.id} className="border-t border-slate-50 transition hover:bg-slate-50/60">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700 flex-shrink-0">
                            {user.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="font-semibold text-slate-900">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadge(user.role)}`}>{user.role}</span>
                      </td>
                      <td className="py-3 text-slate-500">{user.email}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {/* ── Credentials Modal ── */}
      {credModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Uploaded Credentials</h2>
                <p className="text-sm text-slate-500">{credModal.full_name} · {credModal.email}</p>
              </div>
              <button onClick={() => setCredModal(null)} className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {docsLoading ? (
                <p className="py-10 text-center text-slate-400">Loading documents…</p>
              ) : docs.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl">📂</p>
                  <p className="mt-2 font-semibold text-slate-600">No documents uploaded</p>
                  <p className="text-sm text-slate-400">This provider has not submitted any credentials yet.</p>
                </div>
              ) : (
                docs.map(doc => (
                  <div key={doc.id} className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
                      <div>
                        <span className="text-sm font-semibold text-slate-700">
                          {doc.doc_type_label || DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">· {doc.file_name}</span>
                      </div>
                      <a href={`${API_BASE_URL}${doc.url}`} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold text-teal-600 hover:underline">Open ↗</a>
                    </div>
                    {doc.mime_type?.startsWith("image/") ? (
                      <img src={`${API_BASE_URL}${doc.url}`} alt={doc.file_name}
                        className="max-h-64 w-full cursor-zoom-in bg-slate-100 object-contain"
                        onClick={() => setLightbox(`${API_BASE_URL}${doc.url}`)} />
                    ) : (
                      <div className="flex items-center gap-3 bg-red-50 px-4 py-5">
                        <span className="text-4xl">📄</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{doc.file_name}</p>
                          <a href={`${API_BASE_URL}${doc.url}`} target="_blank" rel="noreferrer"
                            className="text-xs font-semibold text-blue-600 hover:underline">Click to view PDF ↗</a>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between rounded-b-3xl border-t border-slate-100 bg-slate-50 px-6 py-4">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(credModal.verification_status)}`}>
                {credModal.verification_status}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(credModal.id)}
                  className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                  ✓ Approve
                </button>
                <button onClick={() => handleReject(credModal.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                  ✕ Reject
                </button>
                <button onClick={() => setCredModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="credential full view" className="max-h-full max-w-full rounded-2xl shadow-2xl" />
          <button onClick={() => setLightbox(null)} className="absolute right-5 top-5 text-3xl font-bold text-white hover:text-slate-300">×</button>
        </div>
      )}
    </AdminLayout>
  );
}
