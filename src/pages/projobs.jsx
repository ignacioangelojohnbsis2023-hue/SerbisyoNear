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

export default function ProJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completeJobId, setCompleteJobId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptJob, setReceiptJob] = useState(null);
  const [page, setPage] = useState(1);

  const providerName = (() => {
    try { return JSON.parse(localStorage.getItem("user"))?.full_name || "Provider"; }
    catch { return "Provider"; }
  })();

  useEffect(() => {
    async function fetchJobs() {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (!user?.id) { setErrorMessage("User not found. Please log in again."); setLoading(false); return; }
        const res = await fetch(`${API_BASE_URL}/pro/jobs/${user.id}`);
        const data = await res.json();
        if (data.status === "success") setJobs(data.jobs);
        else setErrorMessage(data.message || "Failed to load jobs.");
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading jobs.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  function openCompleteModal(jobId) { setCompleteJobId(jobId); }
  function closeCompleteModal() { if (processing) return; setCompleteJobId(null); }

  async function confirmCompleteJob() {
    if (!completeJobId) return;
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/pro/jobs/${completeJobId}/complete`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success") {
        setJobs((prev) => prev.map((job) => job.id === completeJobId ? { ...job, status: "completed" } : job));
        setSuccessMessage("Job marked as completed.");
        setCompleteJobId(null);
      } else {
        setErrorMessage(data.message || "Failed to complete job.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while completing job.");
    } finally {
      setProcessing(false);
    }
  }

  function handlePrint(job) {
    const receiptNo = generateReceiptNo(job);
    const win = window.open("", "_blank", "width=700,height=900");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - SerbisyoNear</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #fff;
            color: #1e293b;
            padding: 0;
          }
          .page {
            max-width: 560px;
            margin: 40px auto;
            padding: 40px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            margin-bottom: 24px;
            border-bottom: 2px solid #0f766e;
          }
          .brand {
            font-size: 26px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .receipt-no {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 8px;
          }
          .rows {
            width: 100%;
            border-collapse: collapse;
          }
          .rows tr td {
            padding: 10px 0;
            font-size: 13.5px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
          }
          .rows tr td:first-child {
            color: #64748b;
            width: 42%;
            font-weight: 500;
          }
          .rows tr td:last-child {
            color: #1e293b;
            font-weight: 600;
            text-align: right;
          }
          .total-row td {
            border-bottom: none !important;
            padding-top: 16px !important;
            font-size: 15px !important;
            font-weight: 800 !important;
            color: #0f766e !important;
          }
          .divider {
            border: none;
            border-top: 2px dashed #e2e8f0;
            margin: 16px 0;
          }
          .badge-wrap {
            text-align: center;
            margin: 20px 0;
          }
          .badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 5px 20px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #f1f5f9;
            font-size: 11.5px;
            color: #94a3b8;
            line-height: 1.7;
          }
          @media print {
            body { background: white; }
            .page { border: none; margin: 0; padding: 30px; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">SerbisyoNear</div>
            <div class="subtitle">Official Service Receipt</div>
            <div class="receipt-no">${receiptNo}</div>
          </div>

          <table class="rows">
            <tr>
              <td>Service Provider</td>
              <td>${providerName}</td>
            </tr>
            <tr>
              <td>Client</td>
              <td>${job.resident_name}</td>
            </tr>
            <tr>
              <td>Service</td>
              <td>${job.service_name}</td>
            </tr>
            <tr>
              <td>Booking Date</td>
              <td>${job.booking_date}</td>
            </tr>
            <tr>
              <td>Completed On</td>
              <td>${formatDate(job.created_at)}</td>
            </tr>
            ${job.notes ? `<tr><td>Notes</td><td>${job.notes}</td></tr>` : ""}
            <tr>
              <td>Payment</td>
              <td style="color: #0f766e;">GCash ✓</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount</td>
              <td>₱${Number(job.amount || 0).toLocaleString()}</td>
            </tr>
          </table>

          <hr class="divider" />

          <div class="badge-wrap">
            <span class="badge">✓ Completed &amp; Paid</span>
          </div>

          <div class="footer">
            Thank you for using SerbisyoNear!<br />
            This serves as your official receipt for the service rendered.<br />
            <strong style="color: #0f766e;">www.serbisyonear.com</strong>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  function getStatusBadge(status) {
    if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
    if (status === "pending")   return "bg-amber-100 text-amber-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  }

  function formatDate(str) {
    if (!str) return "—";
    try {
      return new Date(str).toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return str; }
  }

  function generateReceiptNo(job) {
    const date = job.created_at ? new Date(job.created_at) : new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const id = String(job.id).padStart(5, "0");
    return `SN-${y}${m}${d}-${id}`;
  }

  const selectedJob = jobs.find((job) => job.id === completeJobId);
  const pagedJobs = jobs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <ProLayout title="My Jobs">
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
              <button onClick={() => setSuccessMessage("")}
                className="rounded-lg px-3 py-1 text-sm font-semibold hover:bg-emerald-100">Close</button>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-slate-900">My Jobs</h2>
            <p className="mt-2 text-slate-500">View all bookings assigned to you.</p>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-slate-500">You have no jobs yet.</p>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-sm text-slate-500">
                    <th className="pb-3 font-semibold">Service</th>
                    <th className="pb-3 font-semibold">Resident</th>
                    <th className="pb-3 font-semibold">Booking Date</th>
                    <th className="pb-3 font-semibold">Created At</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Notes</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedJobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-50">
                      <td className="py-4 font-medium text-slate-900">{job.service_name}</td>
                      <td className="py-4 text-slate-600">{job.resident_name}</td>
                      <td className="py-4 text-slate-600">{job.booking_date}</td>
                      <td className="py-4 text-slate-400 text-sm">{formatDate(job.created_at)}</td>
                      <td className="py-4 font-semibold text-emerald-700">₱{Number(job.amount || 0).toLocaleString()}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{job.notes || "-"}</td>
                      <td className="py-4">
                        <div className="flex flex-col gap-2">
                          {job.status === "confirmed" && (
                            <button onClick={() => openCompleteModal(job.id)} disabled={processing}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                              Mark as Completed
                            </button>
                          )}
                          {job.status === "completed" && (
                            <button onClick={() => setReceiptJob(job)}
                              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                              View Receipt
                            </button>
                          )}
                          {job.status !== "confirmed" && job.status !== "completed" && (
                            <span className="text-sm text-slate-400">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={jobs.length} page={page} perPage={PER_PAGE} onPage={setPage} />
            </>
          )}
        </div>

        {/* Complete Job Modal */}
        {completeJobId && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-extrabold text-slate-900">Complete Job</h3>
              <p className="mt-2 text-slate-500">Are you sure you want to mark this job as completed?</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-1">
                <div><span className="font-semibold">Service:</span> {selectedJob.service_name}</div>
                <div><span className="font-semibold">Resident:</span> {selectedJob.resident_name}</div>
                <div><span className="font-semibold">Booking Date:</span> {selectedJob.booking_date}</div>
                <div><span className="font-semibold">Amount:</span> ₱{Number(selectedJob.amount || 0).toLocaleString()}</div>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={closeCompleteModal} disabled={processing}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Back
                </button>
                <button type="button" onClick={confirmCompleteJob} disabled={processing}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {processing ? "Completing..." : "Yes, Complete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {receiptJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">

              {/* On-screen preview */}
              <div className="text-center border-b-2 border-teal-700 pb-4 mb-5">
                <div className="text-2xl font-extrabold text-teal-700">SerbisyoNear</div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Official Service Receipt</div>
                <div className="text-xs text-slate-400 mt-1">{generateReceiptNo(receiptJob)}</div>
              </div>

              <div className="space-y-0 text-sm">
                {[
                  ["Service Provider", providerName],
                  ["Client", receiptJob.resident_name],
                  ["Service", receiptJob.service_name],
                  ["Booking Date", receiptJob.booking_date],
                  ["Completed On", formatDate(receiptJob.created_at)],
                  ...(receiptJob.notes ? [["Notes", receiptJob.notes]] : []),
                  ["Payment", "GCash "],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5 border-b border-slate-100">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 mt-1">
                  <span className="text-base font-bold text-teal-700">Total Amount</span>
                  <span className="text-base font-extrabold text-teal-700">
                    ₱{Number(receiptJob.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  ✓ Completed &amp; Paid
                </span>
              </div>

              <div className="mt-4 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
                Thank you for using SerbisyoNear!<br />
                This serves as your official receipt for the service rendered.
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setReceiptJob(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Close
                </button>
                <button onClick={() => handlePrint(receiptJob)}
                  className="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800">
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProLayout>
  );
}
