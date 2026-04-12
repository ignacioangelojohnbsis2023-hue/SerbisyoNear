import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "../components/AdminLayout";
import { API_BASE_URL } from "../lib/api";

const PER_PAGE = 10;

const DOC_TYPE_LABELS = {
  government_id: "Government-Issued ID",
  diploma: "Diploma / Academic Certificate",
  certificate: "Skills / Trade Certificate",
  other: "Other Document",
};

function Pagination({ total, page, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-2 py-2 text-sm text-slate-400">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${p === page ? "bg-teal-700 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === Math.ceil(total / perPage)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}

function getStatusBadge(status) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "pending")  return "bg-amber-100 text-amber-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Credentials modal
  const [credModal, setCredModal] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // Load all providers once
  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/admin/providers`);
        const data = await res.json();
        if (data.status === "success") setProviders(data.providers);
        else alert(data.message || "Failed to load providers.");
      } catch { alert("Something went wrong."); }
      finally { setLoading(false); }
    }
    fetchProviders();
  }, []);

  // Live filter
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return providers.filter(p => {
      const matchesSearch = !keyword
        || (p.full_name || "").toLowerCase().includes(keyword)
        || (p.email || "").toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "all" || p.verification_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [providers, search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function updateStatus(providerId, action) {
    await fetch(`${API_BASE_URL}/admin/providers/${providerId}/${action}`, { method: "PUT" });
    const newStatus = action === "approve" ? "approved" : "rejected";
    setProviders(prev => prev.map(p => p.id === providerId ? { ...p, verification_status: newStatus } : p));
    if (credModal?.id === providerId) setCredModal(m => ({ ...m, verification_status: newStatus }));
  }

  async function openCredentials(provider) {
    setCredModal(provider);
    setDocs([]);
    setDocsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/providers/${provider.id}/documents`);
      const data = await res.json();
      if (data.status === "success") setDocs(data.documents);
    } catch { /* ignore */ }
    setDocsLoading(false);
  }

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminLayout title="Providers">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold text-slate-900">Provider Management</h2>
          <p className="mt-2 text-slate-500">View all registered service providers and verify their credentials.</p>
        </div>

        {/* Live search + filter */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by provider name or email..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-teal-500 md:w-56">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {!loading && (
          <p className="mb-3 text-xs text-slate-400">
            {filtered.length} provider{filtered.length !== 1 ? "s" : ""} found
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {loading ? (
          <p className="text-slate-500">Loading providers...</p>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-slate-50">
            <p className="text-sm text-slate-400">
              {search ? `No providers match "${search}".` : "No providers found."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-sm text-slate-500">
                    <th className="pb-3 font-semibold">Full Name</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Phone</th>
                    <th className="pb-3 font-semibold">Address</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((provider) => (
                    <tr key={provider.id} className="border-b border-slate-50">
                      <td className="py-4 font-medium text-slate-900">{provider.full_name}</td>
                      <td className="py-4 text-slate-600">{provider.email}</td>
                      <td className="py-4 text-slate-600">{provider.phone || "—"}</td>
                      <td className="py-4 text-slate-600 max-w-[200px] truncate">{provider.address || "—"}</td>
                      <td className="py-4">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {provider.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(provider.verification_status)}`}>
                          {provider.verification_status || "unknown"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openCredentials(provider)}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                            Credentials
                          </button>
                          {provider.verification_status !== "approved" && (
                            <button onClick={() => updateStatus(provider.id, "approve")}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                              ✓ Approve
                            </button>
                          )}
                          {provider.verification_status !== "rejected" && (
                            <button onClick={() => updateStatus(provider.id, "reject")}
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                              ✕ Reject
                            </button>
                          )}
                        </div>
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

      {/* ── Credentials Modal ── */}
      {credModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Uploaded Credentials</h2>
                <p className="text-sm text-slate-500">{credModal.full_name} · {credModal.email}</p>
              </div>
              <button onClick={() => setCredModal(null)}
                className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">Close</button>
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
                docs.map((doc) => (
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
                {credModal.verification_status !== "approved" && (
                  <button onClick={() => updateStatus(credModal.id, "approve")}
                    className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                    ✓ Approve
                  </button>
                )}
                {credModal.verification_status !== "rejected" && (
                  <button onClick={() => updateStatus(credModal.id, "reject")}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    ✕ Reject
                  </button>
                )}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="credential full view" className="max-h-full max-w-full rounded-2xl shadow-2xl" />
          <button onClick={() => setLightbox(null)}
            className="absolute right-5 top-5 text-3xl font-bold text-white hover:text-slate-300">×</button>
        </div>
      )}
    </AdminLayout>
  );
}
