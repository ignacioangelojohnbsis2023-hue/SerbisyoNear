import React, { useEffect, useState } from "react";
import ProLayout from "../components/ProLayout";
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

export default function ProRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [acceptanceNote, setAcceptanceNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (!user?.id) { setErrorMessage("User not found. Please log in again."); setLoading(false); return; }
        const res = await fetch(`${API_BASE_URL}/pro/requests/${user.id}`);
        const data = await res.json();
        if (data.status === "success") setRequests(data.requests);
        else setErrorMessage(data.message || "Failed to load requests.");
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading requests.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  function openActionModal(request, action) { setSelectedRequest(null); setActionModal({ request, action }); setAcceptanceNote(""); }
  function closeActionModal() { if (processing) return; setActionModal(null); setAcceptanceNote(""); }

  async function confirmAction() {
    if (!actionModal?.request?.id || !actionModal?.action) return;
    const bookingId = actionModal.request.id;
    const action = actionModal.action;
    try {
      setProcessing(true);
      let res;
      if (action === "accept") {
        res = await fetch(`${API_BASE_URL}/pro/requests/${bookingId}/accept`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: acceptanceNote.trim() || null }),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/pro/requests/${bookingId}/decline`, { method: "PUT" });
      }
      const data = await res.json();
      if (data.status === "success") {
        setRequests((prev) => prev.filter((r) => r.id !== bookingId));
        setSuccessMessage(action === "accept" ? "Booking accepted! The resident has been notified." : "Booking declined successfully.");
        setActionModal(null);
        setAcceptanceNote("");
        setPage(1);
      } else {
        setErrorMessage(data.message || `Failed to ${action} booking.`);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(`Something went wrong while ${action === "accept" ? "accepting" : "declining"} booking.`);
    } finally {
      setProcessing(false);
    }
  }

  function getStatusBadge(status) {
    if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
    if (status === "pending")   return "bg-amber-100 text-amber-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
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

  const pagedRequests = requests.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <ProLayout title="Job Requests">
      <div className="space-y-6">
        {errorMessage && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-red-700 shadow-sm">
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}
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
            <h2 className="text-2xl font-extrabold text-slate-900">Job Requests</h2>
            <p className="mt-2 text-slate-500">View pending booking requests assigned to you.</p>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-slate-500">You have no pending requests.</p>
          ) : (
            <>
              <div className="space-y-3">
                {pagedRequests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => setSelectedRequest(request)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 sm:text-lg">{request.service_name}</h3>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusBadge(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span className="font-medium text-slate-800">{request.resident_name}</span>
                          <span>{formatBookingDate(request.booking_date)}</span>
                          <span className="font-semibold text-emerald-700">₱{Number(request.amount || 0).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                          {request.resident_address || "No address on file"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">Details</span>
                        <span aria-hidden="true" className="text-lg text-slate-400">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Pagination total={requests.length} page={page} perPage={PER_PAGE} onPage={setPage} />
            </>
          )}

          {selectedRequest && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
              <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Booking request</p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-900">{selectedRequest.service_name}</h3>
                  </div>
                  <button onClick={() => setSelectedRequest(null)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Resident</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{selectedRequest.resident_name}</p>
                        {selectedRequest.resident_phone ? (
                          <a href={`tel:${selectedRequest.resident_phone}`} className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">
                            📞 {selectedRequest.resident_phone}
                          </a>
                        ) : (
                          <p className="mt-2 text-sm italic text-slate-400">No phone number on file</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Booking date</p>
                      <p className="mt-2 text-base font-bold text-slate-900">{formatBookingDate(selectedRequest.booking_date)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadge(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                        <span className="text-sm font-semibold text-emerald-700">₱{Number(selectedRequest.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Resident location</p>
                    {selectedRequest.resident_address ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-base font-semibold text-slate-800">📍 {selectedRequest.resident_address}</p>
                        {selectedRequest.resident_lat != null && selectedRequest.resident_lon != null && (
                          <p className="text-sm text-slate-500">
                            Coordinates: {Number(selectedRequest.resident_lat).toFixed(5)}, {Number(selectedRequest.resident_lon).toFixed(5)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm italic text-slate-400">No address or coordinates available.</p>
                    )}
                  </div>

                  {selectedRequest.notes && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Request notes</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selectedRequest.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 border-t border-slate-200 px-5 py-4">
                  <button type="button" onClick={() => setSelectedRequest(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back</button>
                  <button type="button" onClick={() => openActionModal(selectedRequest, "accept")} disabled={processing} className="flex-1 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60">Accept</button>
                  <button type="button" onClick={() => openActionModal(selectedRequest, "decline")} disabled={processing} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60">Decline</button>
                </div>
              </div>
            </div>
          )}

          {actionModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{actionModal.action === "accept" ? "✅" : "❌"}</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {actionModal.action === "accept" ? "Accept Request" : "Decline Request"}
                  </h3>
                </div>
                <p className="text-slate-500 text-sm mb-4">
                  {actionModal.action === "accept"
                    ? "Review the resident's details before accepting."
                    : "Are you sure you want to decline this booking request?"}
                </p>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service</span>
                    <span className="font-semibold">{actionModal.request.service_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Date</span>
                    <span className="font-semibold">{formatBookingDate(actionModal.request.booking_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-semibold text-emerald-700">₱{Number(actionModal.request.amount || 0).toLocaleString()}</span>
                  </div>
                  {(actionModal.request.resident_address || (actionModal.request.resident_lat != null && actionModal.request.resident_lon != null)) && (
                    <div className="space-y-1 pt-2">
                      <span className="text-slate-500">Resident Location</span>
                      {actionModal.request.resident_address && (
                        <p className="font-medium text-slate-700">📍 {actionModal.request.resident_address}</p>
                      )}
                      {actionModal.request.resident_lat != null && actionModal.request.resident_lon != null && (
                        <p className="text-xs text-slate-500">
                          Coordinates: {Number(actionModal.request.resident_lat).toFixed(5)}, {Number(actionModal.request.resident_lon).toFixed(5)}
                        </p>
                      )}
                    </div>
                  )}
                  {actionModal.request.notes && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Resident Notes</span>
                      <span className="font-medium text-right">{actionModal.request.notes}</span>
                    </div>
                  )}
                </div>

                {actionModal.action === "accept" && (
                  <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-teal-600 mb-2">Resident Contact Info</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{actionModal.request.resident_name}</p>
                        {actionModal.request.resident_phone ? (
                          <p className="text-sm text-slate-600 mt-0.5">📞 {actionModal.request.resident_phone}</p>
                        ) : (
                          <p className="text-sm text-slate-400 mt-0.5 italic">No phone number on file</p>
                        )}
                      </div>
                      {actionModal.request.resident_phone && (
                        <div className="flex gap-2">
                          <a href={`tel:${actionModal.request.resident_phone}`} className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">📞 Call</a>
                          <a href={`sms:${actionModal.request.resident_phone}`} className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">💬 SMS</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {actionModal.action === "accept" && (
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700">
                      Message to Resident <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea value={acceptanceNote} onChange={(e) => setAcceptanceNote(e.target.value)} rows={3}
                      placeholder="e.g. I'll arrive at 9:00 AM. Please prepare the area. See you then!"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                    <p className="mt-1 text-xs text-slate-400">This message will be visible to the resident in their bookings page.</p>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={closeActionModal} disabled={processing}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    Back
                  </button>
                  <button type="button" onClick={confirmAction} disabled={processing}
                    className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 ${
                      actionModal.action === "accept" ? "bg-teal-700 hover:bg-teal-800" : "bg-red-600 hover:bg-red-700"
                    }`}>
                    {processing
                      ? actionModal.action === "accept" ? "Accepting..." : "Declining..."
                      : actionModal.action === "accept" ? "Yes, Accept" : "Yes, Decline"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Modal */}
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{actionModal.action === "accept" ? "" : "❌"}</span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {actionModal.action === "accept" ? "Accept Request" : "Decline Request"}
                </h3>
              </div>
              <p className="text-slate-500 text-sm mb-4">
                {actionModal.action === "accept"
                  ? "Review the resident's details before accepting."
                  : "Are you sure you want to decline this booking request?"}
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-semibold">{actionModal.request.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Date</span>
                  <span className="font-semibold">{formatBookingDate(actionModal.request.booking_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-semibold text-emerald-700">₱{Number(actionModal.request.amount || 0).toLocaleString()}</span>
                </div>
                {actionModal.request.notes && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500 shrink-0">Resident Notes</span>
                    <span className="font-medium text-right">{actionModal.request.notes}</span>
                  </div>
                )}
              </div>

              {actionModal.action === "accept" && (
                <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-600 mb-2">Resident Contact Info</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{actionModal.request.resident_name}</p>
                      {actionModal.request.resident_phone ? (
                        <p className="text-sm text-slate-600 mt-0.5">📞 {actionModal.request.resident_phone}</p>
                      ) : (
                        <p className="text-sm text-slate-400 mt-0.5 italic">No phone number on file</p>
                      )}
                    </div>
                    {actionModal.request.resident_phone && (
                      <div className="flex gap-2">
                        <a href={`tel:${actionModal.request.resident_phone}`}
                          className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800">
                          📞 Call
                        </a>
                        <a href={`sms:${actionModal.request.resident_phone}`}
                          className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                          💬 SMS
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {actionModal.action === "accept" && (
                <div className="mt-4">
                  <label className="text-sm font-semibold text-slate-700">
                    Message to Resident <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea value={acceptanceNote} onChange={(e) => setAcceptanceNote(e.target.value)} rows={3}
                    placeholder="e.g. I'll arrive at 9:00 AM. Please prepare the area. See you then!"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                  <p className="mt-1 text-xs text-slate-400">This message will be visible to the resident in their bookings page.</p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={closeActionModal} disabled={processing}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Back
                </button>
                <button type="button" onClick={confirmAction} disabled={processing}
                  className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 ${
                    actionModal.action === "accept" ? "bg-teal-700 hover:bg-teal-800" : "bg-red-600 hover:bg-red-700"
                  }`}>
                  {processing
                    ? actionModal.action === "accept" ? "Accepting..." : "Declining..."
                    : actionModal.action === "accept" ? "Yes, Accept" : "Yes, Decline"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProLayout>
  );
}
