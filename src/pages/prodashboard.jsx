import React, { useEffect, useMemo, useState } from "react";
import ProLayout from "../components/ProLayout";
import { API_BASE_URL } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from "recharts";

// ── Onboarding Modal ──────────────────────────────────────────────────────────
function OnboardingModal({ userId, onComplete }) {
  const [step, setStep] = useState(0);
  const [allServices, setAllServices] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/services`)
      .then((r) => r.json())
      .then((d) => { if (d.status === "success") setAllServices(d.services); })
      .catch(console.error);
  }, []);

  function toggleService(service) {
    setSelected((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) return prev.filter((s) => s.id !== service.id);
      return [...prev, { id: service.id, name: service.name, price: service.price || 500 }];
    });
  }

  function handlePriceChange(id, price) {
    setSelected((prev) => prev.map((s) => s.id === id ? { ...s, price: Number(price) } : s));
  }

  async function handleFinish() {
    if (selected.length === 0) { setError("Please select at least one service."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${userId}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: selected.map((s) => ({ id: s.id, price: s.price })) }),
      });
      const data = await res.json();
      if (data.status === "success") { setStep(3); setTimeout(() => onComplete(), 1800); }
      else setError(data.message || "Failed to save services.");
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user.full_name?.split(" ")[0] || "there";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        {step < 3 && (
          <div className="h-1 bg-slate-100">
            <div className="h-full bg-teal-600 transition-all duration-500" style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>
        )}

        {step === 0 && (
          <div className="flex flex-col items-center px-10 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 mb-6">
              <svg className="w-8 h-8 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome, {firstName}!</h1>
            <p className="mt-3 text-slate-500 max-w-md leading-relaxed">
              You're almost ready to start receiving bookings on <span className="font-semibold text-teal-700">SerbisyoNear</span>. Let's set up your service profile.
            </p>
            <div className="mt-8 w-full max-w-sm space-y-3 text-left">
              {[
                { label: "Pick the services you offer" },
                { label: "Set your rates per service" },
                { label: "Start accepting bookings" },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="mt-8 w-full max-w-sm rounded-xl bg-teal-700 py-3.5 text-sm font-bold text-white hover:bg-teal-800 transition">
              Get Started
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="px-8 py-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">Step 1 of 2</p>
              <h2 className="text-2xl font-extrabold text-slate-900">What services do you offer?</h2>
              <p className="mt-1 text-sm text-slate-500">Select all that apply. You can update this anytime.</p>
            </div>
            {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-72 overflow-y-auto pr-1">
              {allServices.map((service) => {
                const isChecked = !!selected.find((s) => s.id === service.id);
                return (
                  <button key={service.id} type="button" onClick={() => toggleService(service)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${isChecked ? "border-teal-500 bg-teal-50 ring-2 ring-teal-100" : "border-slate-200 bg-white hover:border-teal-300"}`}>
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition ${isChecked ? "border-teal-600 bg-teal-600" : "border-slate-300"}`}>
                      {isChecked && <span className="text-xs font-bold text-white">✓</span>}
                    </div>
                    <span className="text-xs font-semibold leading-tight text-slate-800">{service.name}</span>
                  </button>
                );
              })}
            </div>
            {selected.length > 0 && (
              <p className="mt-3 text-xs text-teal-600 font-semibold">{selected.length} service{selected.length > 1 ? "s" : ""} selected</p>
            )}
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
              <button onClick={() => { if (selected.length === 0) { setError("Please select at least one service."); return; } setError(""); setStep(2); }}
                className="flex-1 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white hover:bg-teal-800">Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-8 py-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">Step 2 of 2</p>
              <h2 className="text-2xl font-extrabold text-slate-900">Set your rates</h2>
              <p className="mt-1 text-sm text-slate-500">How much do you charge per service?</p>
            </div>
            {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selected.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 gap-4">
                  <span className="text-sm font-semibold text-slate-800 truncate flex-1">{s.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-slate-500">₱</span>
                    <input type="number" min="0" value={s.price} onChange={(e) => handlePriceChange(s.id, e.target.value)}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back</button>
              <button onClick={handleFinish} disabled={saving}
                className="flex-1 rounded-xl bg-teal-700 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60">
                {saving ? "Saving..." : "Finish Setup"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center px-10 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">You're all set!</h2>
            <p className="mt-3 text-slate-500 max-w-sm leading-relaxed">Your services are now live. Residents can start booking you on SerbisyoNear.</p>
            <p className="mt-4 text-sm text-slate-400">Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Accept Modal ──────────────────────────────────────────────────────────────
function AcceptModal({ request, onConfirm, onClose, processing }) {
  const [note, setNote] = useState("");

  function formatBookingDate(str) {
    if (!str || str === "-") return "-";
    const hasTime = str.includes("T") || str.includes(" ");
    try {
      return new Date(str).toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      });
    } catch { return str; }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-extrabold text-slate-900 mb-1">Accept Request</h3>
        <p className="text-slate-500 text-sm mb-4">Review the details before accepting.</p>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Service</span><span className="font-semibold">{request.service_name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-semibold">{formatBookingDate(request.booking_date)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-semibold text-emerald-700">₱{Number(request.amount || 0).toLocaleString()}</span></div>
          {request.notes && <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">Notes</span><span className="font-medium text-right">{request.notes}</span></div>}
        </div>
        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-600 mb-2">Resident Contact</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">{request.resident_name}</p>
              {request.resident_phone ? (
                <p className="text-sm text-slate-600 mt-0.5">{request.resident_phone}</p>
              ) : (
                <p className="text-sm text-slate-400 mt-0.5 italic">No phone on file</p>
              )}
            </div>
            {request.resident_phone && (
              <div className="flex gap-2">
                <a href={`tel:${request.resident_phone}`} className="rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">Call</a>
                <a href={`sms:${request.resident_phone}`} className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">SMS</a>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-700">Message to Resident <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="e.g. I'll arrive at 9:00 AM. Please prepare the area."
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={processing} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Back</button>
          <button onClick={() => onConfirm(note)} disabled={processing} className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
            {processing ? "Accepting..." : "Confirm Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, href, icon }) {
  return (
    <a href={href} className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-100 block">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
          {icon}
        </div>
        <svg className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="mt-4 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-600">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </a>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-teal-700 font-bold mt-1">₱{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function ProDashboard() {
  const [statsData, setStatsData] = useState({
    new_requests: 0, upcoming_jobs: 0,
    completed_jobs: 0, monthly_earnings: 0,
    most_frequent_job: "—",
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [acceptModal, setAcceptModal] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function checkOnboarding() {
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (!user?.id || user.role !== "pro") { setOnboardingChecked(true); return; }
      setUserId(user.id);
      try {
        const res = await fetch(`${API_BASE_URL}/profile/${user.id}/services`);
        const data = await res.json();
        const hasServices = data.status === "success" && (data.services?.length > 0 || data.service_ids?.length > 0);
        if (!hasServices) setShowOnboarding(true);
      } catch {}
      finally { setOnboardingChecked(true); }
    }
    checkOnboarding();
  }, []);

  async function fetchDashboard() {
    try {
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (!user?.id) { setErrorMessage("User not found. Please log in again."); setLoading(false); return; }

      const [dashRes, earningsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pro/dashboard/${user.id}`),
        fetch(`${API_BASE_URL}/pro/earnings/${user.id}`),
      ]);
      const dashData = await dashRes.json();
      const earningsJson = await earningsRes.json();

      if (dashData.status === "success") {
        setStatsData(dashData.stats || {});
        setRecentRequests(dashData.recent_requests || []);
      } else {
        setErrorMessage(dashData.message || "Failed to load dashboard.");
      }

      // Build monthly earnings chart from paid history
      if (earningsJson.status === "success" && earningsJson.history?.length > 0) {
        const monthMap = {};
        earningsJson.history.forEach((b) => {
          const date = new Date(b.booking_date || b.created_at || Date.now());
          const key = date.toLocaleString("en-PH", { month: "short", year: "2-digit" });
          monthMap[key] = (monthMap[key] || 0) + (b.amount || 0);
        });
        const chartData = Object.entries(monthMap)
          .slice(-6)
          .map(([month, earnings]) => ({ month, earnings }));
        setEarningsData(chartData);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while loading dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  async function confirmAccept(note) {
    if (!acceptModal) return;
    setAccepting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/pro/requests/${acceptModal.id}/accept`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note?.trim() || null }),
      });
      const data = await res.json();
      if (data.status === "success") { setAcceptModal(null); await fetchDashboard(); }
      else setErrorMessage(data.message || "Failed to accept request.");
    } catch { setErrorMessage("Something went wrong."); }
    finally { setAccepting(false); }
  }

  async function handleDecline(bookingId) {
    setActionLoading((prev) => ({ ...prev, [bookingId]: "declining" }));
    try {
      const res = await fetch(`${API_BASE_URL}/pro/requests/${bookingId}/decline`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success") await fetchDashboard();
      else setErrorMessage(data.message || "Failed to decline request.");
    } catch { setErrorMessage("Something went wrong."); }
    finally { setActionLoading((prev) => ({ ...prev, [bookingId]: null })); }
  }

  const statCards = useMemo(() => [
    {
      label: "New Requests", value: loading ? "—" : statsData.new_requests || 0,
      sub: "Awaiting your response", href: "/pro/requests",
      icon: <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    },
    {
      label: "Upcoming Jobs", value: loading ? "—" : statsData.upcoming_jobs || 0,
      sub: "Confirmed bookings", href: "/pro/jobs",
      icon: <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
      label: "Completed Jobs", value: loading ? "—" : statsData.completed_jobs || 0,
      sub: "All time", href: "/pro/jobs",
      icon: <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      label: "Monthly Earnings", value: loading ? "—" : `₱${Number(statsData.monthly_earnings || 0).toLocaleString()}`,
      sub: "Paid bookings this month", href: "/pro/earnings",
      icon: <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      label: "Top Service", value: loading ? "—" : statsData.most_frequent_job || "—",
      sub: "Most booked", href: "/pro/jobs",
      icon: <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    },
  ], [statsData, loading]);

  return (
    <ProLayout title="Dashboard"
      topRight={
        <a href="/pro/requests" className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition">
          View Requests
        </a>
      }
    >
      {onboardingChecked && showOnboarding && userId && (
        <OnboardingModal userId={userId} onComplete={() => { setShowOnboarding(false); fetchDashboard(); }} />
      )}
      {acceptModal && (
        <AcceptModal request={acceptModal} onConfirm={confirmAccept}
          onClose={() => !accepting && setAcceptModal(null)} processing={accepting} />
      )}

      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
        )}

        {/* Stat Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </section>

        {/* Chart + Requests */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Earnings Chart */}
          <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Earnings Overview</h2>
                <p className="text-sm text-slate-500 mt-0.5">Monthly paid earnings from completed jobs</p>
              </div>
              <a href="/pro/earnings" className="text-sm font-semibold text-teal-700 hover:underline">View details</a>
            </div>

            {earningsData.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400">No earnings data yet. Complete jobs to see your chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={earningsData} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₱${v >= 1000 ? `${v / 1000}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0fdfa" }} />
                  <Bar dataKey="earnings" radius={[6, 6, 0, 0]}>
                    {earningsData.map((entry, index) => (
                      <Cell key={index}
                        fill={index === earningsData.length - 1 ? "#0f766e" : "#99f6e4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Summary row */}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Earned</p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  ₱{earningsData.reduce((s, d) => s + d.earnings, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Best Month</p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {earningsData.length > 0
                    ? earningsData.reduce((a, b) => a.earnings > b.earnings ? a : b).month
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Avg / Month</p>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {earningsData.length > 0
                    ? `₱${Math.round(earningsData.reduce((s, d) => s + d.earnings, 0) / earningsData.length).toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Pending Requests</h2>
              <a href="/pro/requests" className="text-sm font-semibold text-teal-700 hover:underline">View all</a>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : recentRequests.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400 text-center">No pending requests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {recentRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{request.service_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{request.resident_name}</p>
                        <p className="text-xs text-slate-400">{request.booking_date}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                        ₱{Number(request.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    {request.notes && (
                      <p className="text-xs text-slate-500 bg-white rounded-lg px-3 py-2 mb-2 border border-slate-100">
                        {request.notes}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setAcceptModal(request)}
                        disabled={!!actionLoading[request.id] || accepting}
                        className="flex-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition">
                        Accept
                      </button>
                      <button onClick={() => handleDecline(request.id)}
                        disabled={!!actionLoading[request.id] || accepting}
                        className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition">
                        {actionLoading[request.id] === "declining" ? "Declining..." : "Decline"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { href: "/pro/requests", title: "Manage Requests", desc: "Review new bookings and accept or decline them." },
            { href: "/pro/jobs", title: "View My Jobs", desc: "Check confirmed and completed service jobs." },
            { href: "/pro/earnings", title: "Track Earnings", desc: "Monitor your completed job income and payment status." },
          ].map((link) => (
            <a key={link.href} href={link.href}
              className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-100">
              <div className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">{link.title}</div>
              <p className="mt-1.5 text-sm text-slate-500">{link.desc}</p>
              <p className="mt-3 text-sm font-semibold text-teal-700">Open →</p>
            </a>
          ))}
        </section>
      </div>
    </ProLayout>
  );
}
