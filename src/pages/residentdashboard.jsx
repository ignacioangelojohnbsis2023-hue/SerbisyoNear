import React, { useEffect, useState } from "react";
import ResidentLayout from "../components/ResidentLayout";
import DashboardCard from "../components/DashboardCard";
import { API_BASE_URL } from "../lib/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const STATUS_COLORS = {
  Completed: "#0d9488",
  Confirmed: "#10b981",
  Pending:   "#f59e0b",
  Cancelled: "#f43f5e",
};

const badgeCls = (status) => {
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap";
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return `${base} bg-emerald-100 text-emerald-700`;
  if (s === "pending")   return `${base} bg-amber-100 text-amber-700`;
  if (s === "pending_confirmation") return `${base} bg-purple-100 text-purple-700`;
  if (s === "cancelled") return `${base} bg-rose-100 text-rose-700`;
  if (s === "completed") return `${base} bg-blue-100 text-blue-700`;
  return `${base} bg-slate-100 text-slate-700`;
};

const statusLabel = (status) => {
  if (!status) return "—";
  if (status.toLowerCase() === "pending_confirmation") return "Awaiting Confirmation";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-teal-700 font-bold mt-1">{payload[0].value} booking{payload[0].value !== 1 ? "s" : ""}</p>
      </div>
    );
  }
  return null;
}

function StatCard({ label, value, hint, icon }) {
  const tone = label === "Cancelled Bookings" ? "bg-[#F7E4DD]" : label === "Active Bookings" ? "bg-[#FBEACB]" : "bg-[#EFF6F4]";
  return (
    <div className="prototype-card flex flex-col gap-2.5 p-4 sm:p-5">
      <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-[11px] ${tone}`}>
        {icon}
      </div>
      <div className="font-display text-2xl font-bold text-[#1E2622]">{value}</div>
      <div className="text-[13px] font-semibold text-[#1E2622]">{label}</div>
      {hint && <div className="-mt-1 text-[11.5px] text-[#707B72]">{hint}</div>}
    </div>
  );
}

// ── Provider Avatar (same pattern as residentfind.jsx) ────────────────────────
function ProviderAvatar({ name, photoUrl }) {
  const initials = name
    ? name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : "?";

  return (
    <div className="h-10 w-10 flex-shrink-0 rounded-xl overflow-hidden ring-2 ring-white shadow mb-3">
      {photoUrl ? (
        <img
          src={`${API_BASE_URL}${photoUrl}`}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-teal-700 font-bold text-white text-sm">
          {initials}
        </div>
      )}
    </div>
  );
}

export default function ResidentDashboard() {
  const [stats, setStats] = useState([]);
  const [latestBookings, setLatestBookings] = useState([]);
  const [recommendedPros, setRecommendedPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (!user?.id) { setErrorMessage("User not found. Please log in again."); setLoading(false); return; }
        const res = await fetch(`${API_BASE_URL}/resident/dashboard/${user.id}`);
        const data = await res.json();
        if (data.status === "success") {
          setStats(data.stats || []);
          setLatestBookings(data.latest_bookings || []);
          setRecommendedPros(data.recommended_pros || []);
        } else {
          setErrorMessage(data.message || "Failed to load dashboard.");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Something went wrong while loading dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Build pie chart data from stats
  const chartData = stats
    .filter((s) => ["Completed Services", "Active Bookings", "Cancelled Bookings"].includes(s.label))
    .map((s) => {
      const label = s.label === "Completed Services" ? "Completed"
        : s.label === "Active Bookings" ? "Active"
        : "Cancelled";
      return { name: label, value: s.value };
    })
    .filter((d) => d.value > 0);

  const statIcons = {
    "Active Bookings": <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    "Completed Services": <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    "Total Bookings": <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    "Cancelled Bookings": <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <ResidentLayout title="Dashboard">
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-red-700 text-sm">
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Greeting Hero */}
        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#0F6B5C] via-[#12806E] to-[#1A9884] p-5 text-white shadow-sm sm:p-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-16 h-24 w-24 rounded-full bg-white/10" />
          <p className="relative text-xs font-semibold text-[#FBEACB]">MAY KAILANGAN KA BA?</p>
          <h1 className="relative mt-1 max-w-[360px] font-display text-xl font-bold leading-tight sm:text-[22px]">
            Find a trusted service provider near you today
          </h1>
          <div className="relative mt-4 flex max-w-[340px] items-center gap-2 rounded-[13px] border border-white/30 bg-white/15 p-2.5">
            <span className="text-white/80">⌕</span>
            <input
              aria-label="Search for a service"
              placeholder="Try 'aircon cleaning' or 'plumber'"
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-white outline-none placeholder:text-white/70"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  window.location.href = `/resident/find?search=${encodeURIComponent(event.currentTarget.value)}`;
                }
              }}
            />
            <a href="/resident/find" className="rounded-[9px] bg-[#E8A33D] px-3.5 py-2 text-xs font-bold text-[#101C34] hover:bg-[#D18F26]">Search</a>
          </div>
        </section>

        <section className="flex gap-2.5 overflow-x-auto py-1 scrollbar-hide">
          {["Plumbing", "Electrical", "Cleaning", "Aircon", "Carpentry", "Gardening"].map((category) => (
            <a key={category} href={`/resident/find?search=${encodeURIComponent(category)}`} className="flex w-[78px] shrink-0 flex-col items-center gap-2">
              <span className="prototype-card flex h-[54px] w-[54px] items-center justify-center rounded-2xl text-xl text-[#0F6B5C]">{category === "Plumbing" ? "⌁" : category === "Electrical" ? "ϟ" : category === "Cleaning" ? "⌕" : category === "Aircon" ? "✳" : category === "Carpentry" ? "⌁" : "◒"}</span>
              <span className="text-center text-[11.5px] font-semibold leading-tight text-[#3C463F]">{category}</span>
            </a>
          ))}
        </section>

        <div className="flex items-center justify-between pt-1">
          <h2 className="font-display text-base font-bold text-[#1E2622]">Your bookings, at a glance</h2>
        </div>

        {/* Stat Cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="mt-4 h-7 w-16 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-28 rounded bg-slate-100" />
              </div>
            ))
          ) : (
            stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint}
                icon={statIcons[s.label] || <svg className="w-5 h-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            ))
          )}
        </section>


        {/* Chart + Bookings */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">

          {/* Booking Status Chart */}
          <div className="prototype-card p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Booking Breakdown</h2>
            <p className="text-sm text-slate-500 mb-4">Distribution of your booking statuses</p>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-slate-400">Loading...</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400 text-center">No bookings yet.<br />Book a service to get started.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={3} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-2">
                  {chartData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[entry.name] || "#94a3b8" }} />
                        <span className="text-slate-600">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Latest Bookings */}
          <div className="prototype-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
                <p className="text-sm text-slate-500 mt-0.5">Your latest 5 service bookings</p>
              </div>
              <a href="/resident/bookings" className="text-sm font-semibold text-teal-700 hover:underline">View all</a>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading bookings...</p>
            ) : latestBookings.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50">
                <div className="text-center">
                  <p className="text-sm text-slate-400">No bookings yet.</p>
                  <a href="/resident/find" className="mt-2 inline-block text-sm font-semibold text-teal-700 hover:underline">Find a service</a>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <div className="space-y-3 sm:hidden">
                  {latestBookings.map((b) => (
                    <div key={b.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900 text-sm">{b.service}</p>
                        <span className={badgeCls(b.status)}>{statusLabel(b.status)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{b.pro}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{b.date}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet: table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                        <th className="pb-3 font-semibold">Service</th>
                        <th className="pb-3 font-semibold">Provider</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestBookings.map((b) => (
                        <tr key={b.id} className="border-t border-slate-50">
                          <td className="py-3 font-semibold text-slate-900">{b.service}</td>
                          <td className="py-3 text-slate-600">{b.pro}</td>
                          <td className="py-3 text-slate-500 text-xs">{b.date}</td>
                          <td className="py-3">
                            <span className={badgeCls(b.status)}>{statusLabel(b.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Recommended Providers */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recommended Providers</h2>
              <p className="text-sm text-slate-500 mt-0.5">Approved service providers available in the system</p>
            </div>
            <a href="/resident/find" className="text-sm font-semibold text-teal-700 hover:underline">Browse all</a>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading providers...</p>
          ) : recommendedPros.length === 0 ? (
            <p className="text-sm text-slate-400">No approved providers found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {recommendedPros.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-100 p-4 transition hover:shadow-sm hover:border-teal-100">
                  <ProviderAvatar name={r.pro} photoUrl={r.profile_picture} />

                  <p className="font-semibold text-slate-900 text-sm truncate">{r.pro}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{r.service}</p>
                  <p className="text-xs text-slate-400 truncate">{r.area}</p>
                  {r.distance_km != null && (
                    <p className="mt-1 text-xs font-semibold text-teal-700">{r.distance_km} km away</p>
                  )}
                  <a href="/resident/find"
                    className="mt-3 block w-full rounded-lg bg-teal-700 py-2 text-center text-xs font-semibold text-white hover:bg-teal-800 transition">
                    Book Now
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ResidentLayout>
  );
}
