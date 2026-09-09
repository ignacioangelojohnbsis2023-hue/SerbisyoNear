import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ResidentLayout from "../components/ResidentLayout";
import ChatModal from "../components/ChatModal";
import { API_BASE_URL } from "../lib/api";

const PER_PAGE = 8;
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
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
        {pages.map((p, i) => p === "..." ? (
          <span key={i} className="px-2 py-2 text-sm text-slate-400">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${p === page ? "bg-teal-700 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === Math.ceil(total / perPage)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          className="text-3xl transition-transform hover:scale-110 focus:outline-none">
          <span className={s <= (hovered || value) ? "text-amber-400" : "text-slate-200"}>★</span>
        </button>
      ))}
    </div>
  );
}

const CANCEL_REASONS = [
  "Change of plans",
  "Found another provider",
  "Service no longer needed",
  "Booked by mistake",
  "Provider not responding",
  "Other",
];

export default function ResidentBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [page, setPage] = useState(1);

  // Cancel
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Feedback
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isComplaint, setIsComplaint] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);

  // Rebook
  const [rebookSource, setRebookSource] = useState(null);
  const [rebookDate, setRebookDate] = useState("");
  const [rebookTime, setRebookTime] = useState("09:00");
  const [rebookNotes, setRebookNotes] = useState("");
  const [rebookSubmitting, setRebookSubmitting] = useState(false);

  // Payment
  const [payingId, setPayingId] = useState(null);

  // Completion proof review
  const [proofs, setProofs] = useState([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [rejectProofId, setRejectProofId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingProof, setProcessingProof] = useState(false);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const bookingId = Number(searchParams.get("booking_id"));
    if (!bookingId) return;
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (targetBooking) {
      setSelectedBookingId(bookingId);
      if (searchParams.get("chat") === "1") setChatBooking(targetBooking);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("booking_id");
      nextParams.delete("chat");
      if (nextParams.toString() !== searchParams.toString()) {
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [bookings, searchParams, setSearchParams]);

  async function loadProofs(bookingId) {
    if (!bookingId) { setProofs([]); return; }
    setLoadingProofs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/completion-proofs`);
      const data = await res.json();
      if (data.status === "success") setProofs(data.proofs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProofs(false);
    }
  }

  useEffect(() => {
    if (selectedBookingId) loadProofs(selectedBookingId);
    else setProofs([]);
  }, [selectedBookingId]);

  async function confirmProof(bookingId, proofId) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.id) return;
    setProcessingProof(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/completion-proof/${proofId}/confirm?resident_id=${user.id}`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success") {
        await loadProofs(bookingId);
        await fetchBookings();
      } else {
        alert(data.message || "Failed to confirm proof.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingProof(false);
    }
  }

  function openRejectModal(proofId) {
    setRejectReason("");
    setRejectProofId(proofId);
  }
  function closeRejectModal() { if (processingProof) return; setRejectProofId(null); }

  async function submitRejectProof(bookingId) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.id || !rejectProofId || !rejectReason.trim()) return;
    setProcessingProof(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/completion-proof/${rejectProofId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resident_id: user.id, reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRejectProofId(null);
        await loadProofs(bookingId);
        await fetchBookings();
      } else {
        alert(data.message || "Failed to reject proof.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingProof(false);
    }
  }

  async function fetchBookings() {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user?.id) { alert("User not found. Please log in again."); setLoading(false); return; }
      const res = await fetch(`${API_BASE_URL}/resident/bookings/${user.id}`);
      const data = await res.json();
      if (data.status === "success") setBookings(data.bookings);
      else alert(data.message || "Failed to load bookings.");
    } catch (e) { console.error(e); alert("Something went wrong."); }
    finally { setLoading(false); }
  }

  async function handlePayNow(booking) {
    setPayingId(booking.id);
    try {
      const res = await fetch(`${API_BASE_URL}/payment/create/${booking.id}`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success" && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.message || "Failed to create payment link.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

  async function handlePayCash(booking) {
    if (!window.confirm("Select Cash on Hand? Your provider will confirm once payment is received in person.")) return;
    setPayingId(booking.id);
    try {
      const res = await fetch(`${API_BASE_URL}/payment/cash/${booking.id}`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        await fetchBookings();
      } else {
        alert(data.message || "Failed to select cash payment.");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

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

  function formatDate(str) {
    if (!str || str === "-") return "-";
    try {
      return new Date(str).toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return str; }
  }

  function getStatusBadge(status) {
    if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
    if (status === "pending")   return "bg-amber-100 text-amber-700";
    if (status === "pending_confirmation") return "bg-purple-100 text-purple-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  }

  function getStatusLabel(status) {
    if (status === "pending_confirmation") return "Awaiting Your Confirmation";
    if (!status) return "—";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  function getPaymentBadge(ps) {
    if (ps === "paid")        return "bg-teal-100 text-teal-700";
    if (ps === "pending")     return "bg-amber-100 text-amber-700";
    if (ps === "cash_pending") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-500";
  }

  function getPaymentLabel(booking) {
    const ps = booking.payment_status;
    if (ps === "paid") return "✓ Paid";
    if (ps === "pending") return "⏳ Pending (GCash)";
    if (ps === "cash_pending") return "⏳ Awaiting cash confirmation";
    return "Unpaid";
  }

  // ── Show Pay options only on confirmed+unpaid ──────────────
  function showPayButton(booking, hasApprovedProof = false) {
    return (booking.status === "confirmed" || hasApprovedProof) &&
      !["paid", "pending", "cash_pending"].includes(booking.payment_status);
  }

  function openCancelModal(bookingId) {
    setCancelBookingId(bookingId);
    setCancelReason("");
    setCancelReasonOther("");
  }

  async function confirmCancelBooking() {
    if (!cancelBookingId) return;
    if (!cancelReason) { alert("Please select a reason for cancellation."); return; }
    const finalReason = cancelReason === "Other" ? cancelReasonOther.trim() : cancelReason;
    if (cancelReason === "Other" && !finalReason) { alert("Please describe your reason for cancellation."); return; }
    try {
      setCancelling(true);
      const res = await fetch(`${API_BASE_URL}/resident/bookings/${cancelBookingId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setBookings((prev) => prev.map((b) =>
          b.id === cancelBookingId ? { ...b, status: "cancelled", cancel_reason: finalReason } : b
        ));
        setSuccessMessage("Booking cancelled successfully.");
        setCancelBookingId(null);
      } else alert(data.message || "Failed to cancel.");
    } catch (e) { console.error(e); }
    finally { setCancelling(false); }
  }

  function openFeedbackModal(booking) {
    setFeedbackBooking(booking); setRating(0); setComment(""); setIsComplaint(false); setFeedbackError("");
  }
  function closeFeedbackModal() { if (submittingFeedback) return; setFeedbackBooking(null); }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setFeedbackError("Please select a star rating."); return; }
    try {
      setSubmittingFeedback(true); setFeedbackError("");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: feedbackBooking.id,
          resident_id: user.id,
          provider_id: feedbackBooking.provider_id,
          rating, comment, is_complaint: isComplaint,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSubmittedFeedbacks((prev) => [...prev, feedbackBooking.id]);
        setSuccessMessage("Feedback submitted! Thank you.");
        closeFeedbackModal();
      } else setFeedbackError(data.message || "Failed to submit feedback.");
    } catch (e) { console.error(e); setFeedbackError("Something went wrong."); }
    finally { setSubmittingFeedback(false); }
  }

  function openRebookModal(booking) {
    setRebookSource(booking); setRebookDate(""); setRebookTime("09:00");
    setRebookNotes(booking.notes || ""); setErrorMessage("");
  }
  function closeRebookModal() { if (rebookSubmitting) return; setRebookSource(null); }

  async function handleRebookSubmit(e) {
    e.preventDefault();
    if (!rebookDate) { setErrorMessage("Please select a booking date."); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selected = new Date(rebookDate); selected.setHours(0, 0, 0, 0);
    if (selected < today) { setErrorMessage("Past dates are not allowed."); return; }
    try {
      setRebookSubmitting(true); setErrorMessage("");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!user?.id) { setErrorMessage("User not found."); return; }
      const res = await fetch(`${API_BASE_URL}/resident/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: user.id,
          provider_id: rebookSource.provider_id,
          service_name: rebookSource.service_name,
          booking_date: `${rebookDate} ${rebookTime}`,
          notes: rebookNotes,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        closeRebookModal();
        setSuccessMessage(`Rebooked ${rebookSource.service_name} successfully!`);
        fetchBookings();
      } else setErrorMessage(data.message || "Failed to rebook.");
    } catch (e) { console.error(e); setErrorMessage("Something went wrong."); }
    finally { setRebookSubmitting(false); }
  }

  const statusTabs = ["all", "pending", "confirmed", "completed", "cancelled"];
  const filteredBookings = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);
  const pagedBookings = filteredBookings.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <ResidentLayout title="My Bookings">
      <div className="space-y-6">

        {successMessage && (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{successMessage}</p>
              <button onClick={() => setSuccessMessage("")} className="rounded-lg px-3 py-1 text-sm font-semibold hover:bg-emerald-100">Close</button>
            </div>
          </div>
        )}

        <div className="prototype-card p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">Recent bookings</h2>
            <p className="mt-2 text-slate-500">Track your booked services and their current status.</p>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const count = tab === "all" ? bookings.length : bookings.filter((b) => b.status === tab).length;
              return (
                <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1); }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === tab ? "bg-navy-900 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}>
                  {tab === "all" ? "All" : getStatusLabel(tab)} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-slate-500">Loading bookings...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-slate-500">No {statusFilter !== "all" ? getStatusLabel(statusFilter).toLowerCase() + " " : ""}bookings found.</p>
          ) : (
            <>
              <div className="space-y-3">
                {pagedBookings.map((booking) => {
                  const isSelected = selectedBookingId === booking.id;
                  return (
                    <div key={booking.id} className={`rounded-2xl border px-4 py-4 transition ${
                      isSelected ? "border-teal-200 bg-teal-50 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-teal-200 hover:bg-white"
                    }`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{booking.service_name}</h3>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusBadge(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span><span className="font-medium text-slate-500">Provider:</span> {booking.provider_name || "—"}</span>
                            <span><span className="font-medium text-slate-500">Date:</span> {formatBookingDate(booking.booking_date)}</span>
                            <span><span className="font-medium text-slate-500">Amount:</span> ₱{booking.amount || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Payment</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {booking.status === "confirmed" || booking.status === "completed"
                                ? getPaymentLabel(booking)
                                : "—"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 hover:border-teal-200 hover:text-teal-700"
                          >
                            View details
                            <span aria-hidden="true">→</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setChatBooking(booking)}
                            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-sky-700"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination total={filteredBookings.length} page={page} perPage={PER_PAGE} onPage={setPage} />
            </>
          )}
        </div>

        {(() => {
          const selectedBooking = filteredBookings.find((booking) => booking.id === selectedBookingId) || null;
          if (!selectedBooking) return null;

          return (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
              <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Booking details</p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedBooking.service_name}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedBookingId(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Close
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Booking ID</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{formatBookingId(selectedBooking.id)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Provider</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{selectedBooking.provider_name || "—"}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Booking date</p>
                      <p className="mt-2 text-base font-bold text-slate-900">{formatBookingDate(selectedBooking.booking_date)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Created</p>
                      <p className="mt-2 text-base font-bold text-slate-900">{formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(selectedBooking.status)}`}>
                        {getStatusLabel(selectedBooking.status)}
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">₱{selectedBooking.amount || 0}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Payment</p>
                    <div className="mt-2">
                      {selectedBooking.status === "confirmed" || selectedBooking.status === "completed" || proofs.some((proof) => proof.status === "approved") ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadge(selectedBooking.payment_status)}`}>
                          {getPaymentLabel(selectedBooking)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </div>
                  </div>

                  {selectedBooking.status === "cancelled" && selectedBooking.cancel_reason && (
                    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                      <span className="font-semibold">Cancellation reason:</span> {selectedBooking.cancel_reason}
                    </div>
                  )}

                  {selectedBooking.status === "confirmed" && selectedBooking.acceptance_note && (
                    <div className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-700">
                      <span className="font-semibold">Provider note:</span> {selectedBooking.acceptance_note}
                    </div>
                  )}

                  {selectedBooking.needs_admin_review && (
                    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                      This booking has been flagged for admin review after repeated rejections. Our support team will follow up shortly.
                    </div>
                  )}

                  {(selectedBooking.status === "pending_confirmation" || proofs.length > 0) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Proof of Completion</p>
                      {loadingProofs ? (
                        <p className="mt-2 text-sm text-slate-400">Loading...</p>
                      ) : proofs.length === 0 ? (
                        <p className="mt-2 text-sm italic text-slate-400">No proof submitted yet.</p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {proofs.map((p) => (
                            <div key={p.id} className="rounded-xl border border-slate-100 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-500">Attempt #{p.attempt_number}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  p.status === "approved" ? "bg-teal-100 text-teal-700" :
                                  p.status === "rejected" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {p.status === "approved" ? "✓ Approved" : p.status === "rejected" ? "✗ Rejected" : "⏳ Awaiting your review"}
                                </span>
                              </div>
                              <a href={`${API_BASE_URL}${p.photo_url}`} target="_blank" rel="noreferrer">
                                <img src={`${API_BASE_URL}${p.photo_url}`} alt="Completion proof" className="mt-2 h-40 w-full rounded-lg object-cover" />
                              </a>
                              {p.status === "rejected" && p.rejection_reason && (
                                <p className="mt-2 text-xs text-red-600"><span className="font-semibold">Your reason:</span> {p.rejection_reason}</p>
                              )}
                              {p.status === "pending" && (
                                <div className="mt-3 flex gap-2">
                                  <button type="button" onClick={() => confirmProof(selectedBooking.id, p.id)} disabled={processingProof}
                                    className="flex-1 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
                                    ✓ Confirm Done
                                  </button>
                                  <button type="button" onClick={() => openRejectModal(p.id)} disabled={processingProof}
                                    className="flex-1 rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                                    ✗ Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
                    <p className="mt-2 text-sm text-slate-700">{selectedBooking.notes || "No notes provided."}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setChatBooking(selectedBooking)}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                      Message Provider
                    </button>

                    {selectedBooking.status === "pending" && (
                      <button onClick={() => openCancelModal(selectedBooking.id)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                        Cancel
                      </button>
                    )}

                    {selectedBooking.status === "completed" && (
                      submittedFeedbacks.includes(selectedBooking.id) ? (
                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">✓ Feedback Sent</span>
                      ) : (
                        <button onClick={() => openFeedbackModal(selectedBooking)} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                          Feedback
                        </button>
                      )
                    )}

                    {showPayButton(selectedBooking, proofs.some((proof) => proof.status === "approved")) && (
                      <>
                        <button onClick={() => handlePayNow(selectedBooking)} disabled={payingId === selectedBooking.id} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5">
                          {payingId === selectedBooking.id ? "Processing..." : "Pay via GCash"}
                        </button>
                        <button onClick={() => handlePayCash(selectedBooking)} disabled={payingId === selectedBooking.id} className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5">
                          {payingId === selectedBooking.id ? "Processing..." : "Pay via Cash"}
                        </button>
                      </>
                    )}

                    {["completed", "cancelled"].includes(selectedBooking.status) && (
                      <button onClick={() => openRebookModal(selectedBooking)} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                        Rebook
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {chatBooking && (() => {
          const currentUser = JSON.parse(localStorage.getItem("user") || "null");
          return (
            <ChatModal
              bookingId={chatBooking.id}
              currentUser={currentUser}
              participantName={chatBooking.provider_name}
              participantPicture={chatBooking.provider_picture}
              onClose={() => {
                setChatBooking(null);
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete("booking_id");
                nextParams.delete("chat");
                setSearchParams(nextParams, { replace: true });
              }}
            />
          );
        })()}

        {/* ── Reject Proof Modal ── */}
        {rejectProofId && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-extrabold text-slate-900">Reject Proof</h3>
              <p className="mt-2 text-sm text-slate-500">Tell the provider why this isn't acceptable so they can fix it and resubmit.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="e.g. The area shown doesn't match what was requested..."
                className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-400 focus:outline-none"
              />
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={closeRejectModal} disabled={processingProof}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Cancel
                </button>
                <button type="button" onClick={() => submitRejectProof(selectedBooking.id)} disabled={processingProof || !rejectReason.trim()}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {processingProof ? "Submitting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Cancel Modal ── */}
        {cancelBookingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <div className="mb-1 text-3xl">❌</div>
              <h3 className="text-xl font-extrabold text-slate-900">Cancel Booking</h3>
              <p className="mt-2 text-slate-500">Please let us know why you're cancelling.</p>
              <div className="mt-5 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Reason for cancellation <span className="text-red-500">*</span></p>
                {CANCEL_REASONS.map((reason) => (
                  <label key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                      cancelReason === reason ? "border-red-300 bg-red-50" : "border-slate-200 hover:bg-slate-50"
                    }`}>
                    <input type="radio" name="cancel_reason" value={reason}
                      checked={cancelReason === reason} onChange={() => setCancelReason(reason)}
                      className="accent-red-500" />
                    <span className={`text-sm font-medium ${cancelReason === reason ? "text-red-700" : "text-slate-700"}`}>{reason}</span>
                  </label>
                ))}
                {cancelReason === "Other" && (
                  <textarea value={cancelReasonOther} onChange={(e) => setCancelReasonOther(e.target.value)}
                    rows={3} placeholder="Please describe your reason..."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setCancelBookingId(null)} disabled={cancelling}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Go Back</button>
                <button type="button" onClick={confirmCancelBooking} disabled={cancelling || !cancelReason}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {cancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Rebook Modal ── */}
        {rebookSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-extrabold text-slate-900">🔄 Rebook Service</h3>
              <p className="mt-1 text-slate-500">
                Re-booking <span className="font-semibold text-slate-700">{rebookSource.service_name}</span> with{" "}
                <span className="font-semibold text-slate-700">{rebookSource.provider_name}</span>
              </p>
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 space-y-1">
                <div><span className="font-medium">Original Booking:</span> {formatBookingId(rebookSource.id)}</div>
                <div><span className="font-medium">Service:</span> {rebookSource.service_name}</div>
                <div><span className="font-medium">Estimated Amount:</span> ₱{rebookSource.amount || 0}</div>
              </div>
              {errorMessage && (
                <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{errorMessage}</p>
              )}
              <form onSubmit={handleRebookSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Date <span className="text-red-500">*</span></label>
                    <input type="date" value={rebookDate} onChange={(e) => setRebookDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]} required
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Preferred Time <span className="text-red-500">*</span></label>
                    <input type="time" value={rebookTime} onChange={(e) => setRebookTime(e.target.value)} required
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea value={rebookNotes} onChange={(e) => setRebookNotes(e.target.value)} rows={3}
                    placeholder="Any special instructions..."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-600" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeRebookModal} disabled={rebookSubmitting}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
                  <button type="submit" disabled={rebookSubmitting}
                    className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
                    {rebookSubmitting ? "Rebooking..." : "Confirm Rebook"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Feedback Modal ── */}
        {feedbackBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-extrabold text-slate-900">Leave Feedback</h3>
              <p className="mt-1 text-slate-500">
                Booking {formatBookingId(feedbackBooking.id)} • <span className="font-semibold text-slate-700">{feedbackBooking.service_name}</span> with {feedbackBooking.provider_name}
              </p>
              <form onSubmit={handleFeedbackSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Your Rating <span className="text-red-500">*</span></label>
                  <StarPicker value={rating} onChange={setRating} />
                  {rating > 0 && <p className="mt-1 text-xs text-slate-400">{["","Poor","Fair","Good","Very Good","Excellent"][rating]}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Comment <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
                    placeholder="Share your experience..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                </div>
                <div onClick={() => setIsComplaint((v) => !v)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${isComplaint ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}>
                  <div className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 transition flex items-center justify-center ${isComplaint ? "border-red-500 bg-red-500" : "border-slate-300 bg-white"}`}>
                    {isComplaint && <span className="text-xs text-white font-bold">✓</span>}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isComplaint ? "text-red-700" : "text-slate-700"}`}>🚨 Mark as Complaint</p>
                    <p className="text-xs text-slate-500 mt-0.5">Flag this so our admin team can review and take action.</p>
                  </div>
                </div>
                {feedbackError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{feedbackError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeFeedbackModal} disabled={submittingFeedback}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
                  <button type="submit" disabled={submittingFeedback}
                    className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">
                    {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ResidentLayout>
  );
}
