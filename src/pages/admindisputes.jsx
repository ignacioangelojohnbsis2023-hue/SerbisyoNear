import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { API_BASE_URL } from "../lib/api";

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [refund, setRefund] = useState("");
  const load = () => fetch(`${API_BASE_URL}/admin/disputes${filter ? `?status=${filter}` : ""}`).then((response) => response.json()).then((data) => { if (data.status === "success") setDisputes(data.disputes); });
  useEffect(() => { load(); }, [filter]);
  async function update(status) {
    await fetch(`${API_BASE_URL}/admin/disputes/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, resolution_notes: notes, refund_amount: refund ? Number(refund) : null }) });
    setSelected(null); setNotes(""); setRefund(""); load();
  }
  return <AdminLayout title="Disputes"><div className="space-y-6"><Card className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Admin review</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">Disputes</h2></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm"><option value="">All statuses</option><option value="open">Open</option><option value="under_review">Under Review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></div></Card>{disputes.length === 0 ? <Card className="p-10 text-center"><div className="text-4xl">🛟</div><p className="mt-3 font-semibold text-slate-600">No disputes found</p></Card> : <div className="grid gap-4 lg:grid-cols-2">{disputes.map((dispute) => <Card key={dispute.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-400">Booking #{dispute.booking_id}</p><h3 className="mt-1 font-bold text-slate-900">{dispute.category.replace("_", " ")}</h3></div><Badge variant={dispute.status === "resolved" ? "resolved" : dispute.status === "open" ? "open" : dispute.status === "dismissed" ? "dismissed" : "review"}>{dispute.status.replace("_", " ")}</Badge></div><p className="mt-3 text-sm text-slate-600">{dispute.description}</p><Button variant="secondary" size="sm" className="mt-4" onClick={() => { setSelected(dispute); setNotes(dispute.resolution_notes || ""); }}>Review dispute</Button></Card>)}</div>}{selected && <Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><h3 className="text-xl font-extrabold text-slate-900">Resolve dispute #{selected.id}</h3><Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button></div><div className="mt-4 space-y-3">{selected.comments?.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">{item.comment}<div className="mt-1 text-xs text-slate-400">{item.created_at}</div></div>)}</div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Internal resolution notes" className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" /><input value={refund} onChange={(event) => setRefund(event.target.value)} type="number" min="0" placeholder="Refund adjustment (optional)" className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => update("under_review")}>Under Review</Button><Button onClick={() => update("resolved")}>Resolve</Button><Button variant="secondary" onClick={() => update("dismissed")}>Dismiss</Button></div></Card>}</div></AdminLayout>;
}
