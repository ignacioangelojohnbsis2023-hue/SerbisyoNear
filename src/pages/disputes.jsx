import React, { useEffect, useState } from "react";
import ResidentLayout from "../components/ResidentLayout";
import ProLayout from "../components/ProLayout";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { API_BASE_URL } from "../lib/api";

const labels = { no_show: "No-show", poor_quality: "Poor quality", payment: "Payment issue", safety: "Safety concern", other: "Other" };
const badgeVariant = { open: "open", under_review: "review", resolved: "resolved", dismissed: "dismissed" };

export default function Disputes({ role = "resident" }) {
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const Layout = role === "pro" ? ProLayout : ResidentLayout;
  const user = JSON.parse(localStorage.getItem("user") || "null");

  async function load() {
    if (!user?.id) return;
    const response = await fetch(`${API_BASE_URL}/disputes/user/${user.id}`);
    const data = await response.json();
    if (data.status === "success") setDisputes(data.disputes);
  }
  useEffect(() => { load().catch(() => setError("Failed to load disputes.")); }, []);

  async function addComment(event) {
    event.preventDefault();
    if (!comment.trim() || !selected) return;
    const response = await fetch(`${API_BASE_URL}/disputes/${selected.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ author_id: user.id, comment }) });
    const data = await response.json();
    if (data.status !== "success") { setError(data.message); return; }
    setComment(""); await load(); setSelected((current) => disputes.find((item) => item.id === current?.id) || current);
  }

  return <Layout title="Disputes"><div className="space-y-6">
    {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <Card className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Support</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900">Booking disputes</h2><p className="mt-2 text-slate-500">Review reports and continue the conversation with the other party.</p></Card>
    {disputes.length === 0 ? <Card className="p-10 text-center"><div className="text-4xl">🛟</div><h3 className="mt-3 font-bold text-slate-800">No disputes filed</h3><p className="mt-1 text-sm text-slate-500">If something goes wrong with a booking, you can report it from the booking details.</p></Card> : <div className="grid gap-4 lg:grid-cols-2">{disputes.map((dispute) => <Card key={dispute.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-400">Booking #{dispute.booking_id}</p><h3 className="mt-1 font-bold text-slate-900">{labels[dispute.category] || dispute.category}</h3></div><Badge variant={badgeVariant[dispute.status]}>{dispute.status.replace("_", " ")}</Badge></div><p className="mt-3 text-sm text-slate-600">{dispute.description}</p><Button variant="secondary" size="sm" className="mt-4" onClick={() => setSelected(dispute)}>View thread</Button></Card>)}</div>}
    {selected && <Card className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">Booking #{selected.booking_id}</p><h3 className="text-xl font-extrabold text-slate-900">{labels[selected.category] || selected.category}</h3></div><Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button></div><div className="mt-4 space-y-3">{selected.comments?.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{item.comment}<div className="mt-1 text-xs text-slate-400">{item.created_at}</div></div>)}</div>{selected.status !== "resolved" && selected.status !== "dismissed" && <form onSubmit={addComment} className="mt-4 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Add a follow-up..." /><Button type="submit">Send</Button></form>}</Card>}
  </div></Layout>;
}
