import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../lib/api";

const PER_PAGE = 10;

function Pagination({ total, page, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
      acc.push(p); return acc;
    }, []);
  return (
    <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
      <p className="text-sm text-slate-500">
        Showing {Math.min((page-1)*perPage+1,total)}–{Math.min(page*perPage,total)} of {total}
      </p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onPage(page-1)} disabled={page===1}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
        {pages.map((p,i) => p === "..." ? (
          <span key={i} className="px-2 py-2 text-sm text-slate-400">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${p===page?"bg-teal-700 text-white":"border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page+1)} disabled={page===Math.ceil(total/perPage)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);

  // Fetch once on mount
  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/admin/bookings`);
        const data = await res.json();
        if (data.status === "success") setBookings(data.bookings);
        else alert(data.message || "Failed to load bookings.");
      } catch { alert("Something went wrong."); }
      finally { setLoading(false); }
    }
    fetchBookings();
  }, []);

  // Live client-side filter — no backend calls
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return bookings.filter(b => {
      const matchesSearch = !keyword
        || String(b.id).toLowerCase().includes(keyword)
        || (b.service_name || "").toLowerCase().includes(keyword)
        || (b.resident_name || "").toLowerCase().includes(keyword)
        || (b.provider_name || "").toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      const matchesArchive = showArchived ? b.is_archived : !b.is_archived;
      return matchesSearch && matchesStatus && matchesArchive;
    });
  }, [bookings, search, statusFilter, showArchived]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, showArchived]);

  async function handleArchive(bookingId, isArchived) {
    try {
      setActionLoading(bookingId);
      const res = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/archive`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success")
        setBookings(prev => prev.map(b => b.id===bookingId ? {...b, is_archived: !isArchived} : b));
      else alert(data.message || "Failed.");
    } catch { alert("Something went wrong."); }
    finally { setActionLoading(null); }
  }

  function getStatusBadge(status) {
    if (status==="confirmed") return "bg-emerald-100 text-emerald-700";
    if (status==="pending")   return "bg-amber-100 text-amber-700";
    if (status==="cancelled") return "bg-red-100 text-red-700";
    if (status==="completed") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  }

  function getPaymentBadge(ps) {
    if (ps === "paid")    return "bg-teal-100 text-teal-700";
    if (ps === "pending") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-500";
  }

  function formatDate(str) {
    if (!str || str==="-") return "-";
    try { return new Date(str).toLocaleString("en-PH",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
    catch { return str; }
  }

  const archivedCount = bookings.filter(b => b.is_archived).length;
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  return (
    <AdminLayout title="Bookings">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Booking Management</h2>
            <p className="mt-2 text-slate-500">View and manage all bookings in the platform.</p>
          </div>
          <button onClick={() => setShowArchived(v => !v)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${showArchived?"bg-amber-100 text-amber-700":"border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {showArchived ? `Archived (${archivedCount})` : `View Archived (${archivedCount})`}
          </button>
        </div>

        {/* Live search + filter — no Search/Reset buttons needed */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by booking ID, service, resident, or provider..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-teal-500 md:w-52">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {showArchived && (
          <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium">
            Showing archived bookings — hidden from normal view.
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="mb-3 text-xs text-slate-400">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""} found
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {loading ? <p className="text-slate-500">Loading bookings...</p>
        : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-slate-50">
            <p className="text-sm text-slate-400">
              {search ? `No bookings match "${search}".` : showArchived ? "No archived bookings." : "No bookings found."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-sm text-slate-500">
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Service</th>
                    <th className="pb-3 font-semibold">Resident</th>
                    <th className="pb-3 font-semibold">Provider</th>
                    <th className="pb-3 font-semibold">Booking Date</th>
                    <th className="pb-3 font-semibold">Created At</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Payment</th>
                    <th className="pb-3 font-semibold">Notes</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(booking => (
                    <tr key={booking.id} className={`border-b border-slate-50 ${booking.is_archived?"opacity-60":""}`}>
                      <td className="py-4 text-slate-700">{booking.id}</td>
                      <td className="py-4 font-medium text-slate-900">{booking.service_name}</td>
                      <td className="py-4 text-slate-600">{booking.resident_name}</td>
                      <td className="py-4 text-slate-600">{booking.provider_name}</td>
                      <td className="py-4 text-slate-600">{booking.booking_date}</td>
                      <td className="py-4 text-xs text-slate-400">{formatDate(booking.created_at)}</td>
                      <td className="py-4 font-semibold text-emerald-700">₱{booking.amount||0}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {booking.status === "completed" ? (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadge(booking.payment_status)}`}>
                            {booking.payment_status === "paid"    && "Paid"}
                            {booking.payment_status === "pending" && "Pending"}
                            {(!booking.payment_status || booking.payment_status === "unpaid") && "Unpaid"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-4 text-slate-600 max-w-[140px] truncate">{booking.notes||"-"}</td>
                      <td className="py-4">
                        <button onClick={() => handleArchive(booking.id, booking.is_archived)}
                          disabled={actionLoading===booking.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                            booking.is_archived?"bg-slate-100 text-slate-600 hover:bg-slate-200":"bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>
                          {actionLoading===booking.id?"...":booking.is_archived?"Unarchive":"Archive"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}