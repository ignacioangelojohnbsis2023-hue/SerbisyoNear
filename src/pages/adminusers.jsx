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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [page, setPage] = useState(1);

  // Load all users once on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/admin/users`);
        const data = await res.json();
        if (data.status === "success") setUsers(data.users);
        else alert(data.message || "Failed to load users.");
      } catch { alert("Something went wrong."); }
      finally { setLoading(false); }
    }
    fetchUsers();
  }, []);

  // Live filter — no backend call needed
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter(u => {
      const matchesSearch = !keyword
        || (u.full_name || "").toLowerCase().includes(keyword)
        || (u.email || "").toLowerCase().includes(keyword);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesArchive = showArchived ? u.is_archived : !u.is_archived;
      return matchesSearch && matchesRole && matchesArchive;
    });
  }, [users, search, roleFilter, showArchived]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, roleFilter, showArchived]);

  async function handleArchive(userId, isArchived) {
    if (!window.confirm(isArchived ? "Unarchive this user?" : "Archive this user?")) return;
    try {
      setActionLoading(userId);
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/archive`, { method: "PUT" });
      const data = await res.json();
      if (data.status === "success")
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_archived: !isArchived } : u));
      else alert(data.message || "Failed.");
    } catch { alert("Something went wrong."); }
    finally { setActionLoading(null); }
  }

  function formatDate(str) {
    if (!str || str === "-") return "-";
    try { return new Date(str).toLocaleString("en-PH", { year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit" }); }
    catch { return str; }
  }

  const archivedCount = users.filter(u => u.is_archived).length;
  const paged = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  return (
    <AdminLayout title="Users">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">User Management</h2>
            <p className="mt-2 text-slate-500">View all registered users in the system.</p>
          </div>
          <button onClick={() => setShowArchived(v => !v)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${showArchived?"bg-amber-100 text-amber-700":"border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {showArchived ? `📦 Archived (${archivedCount})` : `📦 View Archived (${archivedCount})`}
          </button>
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
              placeholder="Search by full name or email..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
            )}
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 outline-none focus:border-teal-500 md:w-48">
            <option value="all">All Roles</option>
            <option value="resident">Resident</option>
            <option value="pro">Pro</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {showArchived && (
          <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium">
            📦 Showing archived users — hidden from normal views.
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="mb-3 text-xs text-slate-400">
            {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {loading ? <p className="text-slate-500">Loading users...</p>
        : filtered.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl bg-slate-50">
            <p className="text-sm text-slate-400">
              {search ? `No users match "${search}".` : showArchived ? "No archived users." : "No users found."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-sm text-slate-500">
                    <th className="pb-3 font-semibold">Full Name</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Phone</th>
                    <th className="pb-3 font-semibold">Address</th>
                    <th className="pb-3 font-semibold">Joined</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(user => (
                    <tr key={user.id} className={`border-b border-slate-50 ${user.is_archived?"opacity-60":""}`}>
                      <td className="py-4 font-medium text-slate-900">{user.full_name}</td>
                      <td className="py-4 text-slate-600">{user.email}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role==="admin"?"bg-purple-100 text-purple-700"
                          :user.role==="pro"?"bg-amber-100 text-amber-700"
                          :"bg-emerald-100 text-emerald-700"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{user.phone||"-"}</td>
                      <td className="py-4 text-slate-600 max-w-[160px] truncate">{user.address||"-"}</td>
                      <td className="py-4 text-xs text-slate-400">{formatDate(user.created_at)}</td>
                      <td className="py-4">
                        {user.role !== "admin" && (
                          <button onClick={() => handleArchive(user.id, user.is_archived)}
                            disabled={actionLoading === user.id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                              user.is_archived?"bg-slate-100 text-slate-600 hover:bg-slate-200":"bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>
                            {actionLoading===user.id?"...":user.is_archived?"Unarchive":"Archive"}
                          </button>
                        )}
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
