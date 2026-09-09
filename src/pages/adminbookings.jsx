import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../lib/api";

const PER_PAGE = 10;
const formatBookingId = (id) => `BK-${String(id).padStart(6, "0")}`;

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
  const [selectedBookingId, setSelectedBookingId] = useState(null);
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
      || formatBookingId(b.id).toLowerCase().includes(keyword)
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
            <div className="space-y-3">
              {paged.map(booking => {
                const isSelected = selectedBookingId === booking.id;
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => setSelectedBookingId(booking.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-teal-200 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-teal-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{formatBookingId(booking.id)} • {booking.service_name}</h3>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span><span className="font-medium text-slate-500">Resident:</span> {booking.resident_name || "—"}</span>
                          <span><span className="font-medium text-slate-500">Provider:</span> {booking.provider_name || "—"}</span>
                          <span><span className="font-medium text-slate-500">Date:</span> {booking.booking_date || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
                          <p className="text-lg font-extrabold text-emerald-700">₱{booking.amount || 0}</p>
                        </div>
                        <span aria-label="View booking details" className="rounded-full bg-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-600">View details</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {(() => {
              const selectedBooking = filtered.find((booking) => booking.id === selectedBookingId) || null;
              if (!selectedBooking) return null;

              return (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setSelectedBookingId(null)}>
                  <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Booking details</p>
                        <h3 className="mt-1 text-xl font-extrabold text-slate-900">{formatBookingId(selectedBooking.id)} • {selectedBooking.service_name}</h3>
                      </div>
                    <button type="button" onClick={() => setSelectedBookingId(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white">
                      Close
                    </button>
                  </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Resident</p>
                      <p className="mt-2 font-semibold text-slate-800">{selectedBooking.resident_name || "—"}</p>
                      </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Provider</p>
                      <p className="mt-2 font-semibold text-slate-800">{selectedBooking.provider_name || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Booking Date</p>
                      <p className="mt-2 font-semibold text-slate-800">{selectedBooking.booking_date || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Created At</p>
                      <p className="mt-2 font-semibold text-slate-800">{formatDate(selectedBooking.created_at)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                      <div className="mt-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(selectedBooking.status)}`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Payment</p>
                      <div className="mt-2">
                        {selectedBooking.status === "completed" ? (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadge(selectedBooking.payment_status)}`}>
                            {selectedBooking.payment_status === "paid" && "Paid"}
                            {selectedBooking.payment_status === "pending" && "Pending"}
                            {(!selectedBooking.payment_status || selectedBooking.payment_status === "unpaid") && "Unpaid"}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-300">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
                      <p className="mt-2 text-sm text-slate-700">{selectedBooking.notes || "No notes provided."}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button onClick={() => handleArchive(selectedBooking.id, selectedBooking.is_archived)}
                        disabled={actionLoading===selectedBooking.id}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                          selectedBooking.is_archived ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                        }`}>
                        {actionLoading===selectedBooking.id ? "..." : selectedBooking.is_archived ? "Unarchive" : "Archive"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}