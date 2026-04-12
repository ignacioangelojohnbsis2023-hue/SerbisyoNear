import React, { useEffect, useState } from "react";
import ResidentLayout from "../components/ResidentLayout";
import { API_BASE_URL } from "../lib/api";

const PER_PAGE = 8;

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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  useEffect(() => { fetchBookings(); }, []);

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
    if (status === "cancelled") return "bg-red-100 text-red-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  }

  function getPaymentBadge(ps) {
    if (ps === "paid")    return "bg-teal-100 text-teal-700";
    if (ps === "pending") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-500";
  }

  // ── Show Pay button only on confirmed+unpaid ──────────────
  function showPayButton(booking) {
    return booking.status === "confirmed" && booking.payment_status !== "paid";
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

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">Bookings</h2>
            <p className="mt-2 text-slate-500">Track your booked services and their current status.</p>
          </div>

          {/* Filter tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const count = tab === "all" ? bookings.length : bookings.filter((b) => b.status === tab).length;
              return (
                <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1); }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
                    statusFilter === tab ? "bg-teal-700 text-white shadow" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-slate-500">Loading bookings...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-slate-500">No {statusFilter !== "all" ? statusFilter : ""} bookings found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1350px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-sm text-slate-500">
                      <th className="pb-3 font-semibold">Service</th>
                      <th className="pb-3 font-semibold">Provider</th>
                      <th className="pb-3 font-semibold">Booking Date & Time</th>
                      <th className="pb-3 font-semibold">Created At</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Payment</th>
                      <th className="pb-3 font-semibold">Notes</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-slate-50">
                        <td className="py-4 font-medium text-slate-900">{booking.service_name}</td>
                        <td className="py-4 text-slate-600">{booking.provider_name}</td>
                        <td className="py-4 text-slate-600 whitespace-nowrap">{formatBookingDate(booking.booking_date)}</td>
                        <td className="py-4 text-xs text-slate-400">{formatDate(booking.created_at)}</td>
                        <td className="py-4 font-semibold text-emerald-700">₱{booking.amount || 0}</td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${getStatusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                            {booking.status === "cancelled" && booking.cancel_reason && (
                              <span className="text-xs text-slate-400 italic">"{booking.cancel_reason}"</span>
                            )}
                            {booking.status === "confirmed" && booking.acceptance_note && (
                              <div className="mt-1 flex items-start gap-1 rounded-xl bg-teal-50 px-2 py-1.5">
                                <span className="text-xs">💬</span>
                                <span className="text-xs text-teal-700 italic">"{booking.acceptance_note}"</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Payment status column — only show for confirmed/completed */}
                        <td className="py-4">
                          {["confirmed", "completed"].includes(booking.status) ? (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${getPaymentBadge(booking.payment_status)}`}>
                              {booking.payment_status === "paid"    ? "✓ Paid"
                              : booking.payment_status === "pending" ? "⏳ Pending"
                              : "Unpaid"}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>

                        <td className="py-4 text-slate-600 max-w-[120px] truncate">{booking.notes || "-"}</td>
                        <td className="py-4">
                          <div className="flex flex-col gap-2">

                            {/* Cancel — only pending */}
                            {booking.status === "pending" && (
                              <button onClick={() => openCancelModal(booking.id)}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                Cancel
                              </button>
                            )}

                            {/* Feedback — only completed */}
                            {booking.status === "completed" && (
                              submittedFeedbacks.includes(booking.id) ? (
                                <span className="rounded-xl bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-400">✓ Feedback Sent</span>
                              ) : (
                                <button onClick={() => openFeedbackModal(booking)}
                                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                                  Feedback
                                </button>
                              )
                            )}

                            {showPayButton(booking) && (
                              <button
                                onClick={() => handlePayNow(booking)}
                                disabled={payingId === booking.id}
                                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
                              >
                                {payingId === booking.id ? (
                                  <>
                                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    Processing...
                                  </>
                                ) : (
                                  <>Pay via GCash</>
                                )}
                              </button>
                            )}

                            {/* Rebook — completed or cancelled */}
                            {["completed", "cancelled"].includes(booking.status) && (
                              <button onClick={() => openRebookModal(booking)}
                                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                                Rebook
                              </button>
                            )}

                            {/* Awaiting label — confirmed + already paid */}
                            {booking.status === "confirmed" && booking.payment_status === "paid" && (
                              <span className="text-sm text-slate-400">Awaiting completion</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                total={filteredBookings.length}
                page={page}
                perPage={PER_PAGE}
                onPage={setPage}
              />
            </>
          )}
        </div>

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
                <div><span className="font-medium">Original Booking:</span> #{rebookSource.id}</div>
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
                Booking #{feedbackBooking.id} • <span className="font-semibold text-slate-700">{feedbackBooking.service_name}</span> with {feedbackBooking.provider_name}
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
