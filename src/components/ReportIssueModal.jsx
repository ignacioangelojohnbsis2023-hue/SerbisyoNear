import React, { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { API_BASE_URL } from "../lib/api";

const categories = [
  ["no_show", "No-show"],
  ["poor_quality", "Poor quality"],
  ["payment", "Payment issue"],
  ["safety", "Safety concern"],
  ["other", "Other"],
];

export default function ReportIssueModal({ booking, user, onClose, onSubmitted }) {
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const formData = new FormData();
      formData.append("reporter_id", user.id);
      formData.append("category", category);
      formData.append("description", description);
      if (file) formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.id}/disputes`, { method: "POST", body: formData });
      const data = await response.json();
      if (data.status !== "success") throw new Error(data.message);
      onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(submitError.message || "Failed to report the issue.");
    } finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Report an Issue">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <label className="block"><span className="text-sm font-semibold text-slate-700">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block"><span className="text-sm font-semibold text-slate-700">Description</span><textarea required minLength={10} value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" placeholder="Tell us what happened..." /></label>
        <label className="block"><span className="text-sm font-semibold text-slate-700">Photo evidence (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-slate-500" /></label>
        <Button type="submit" loading={saving} size="lg" className="w-full">Submit report</Button>
      </form>
    </Modal>
  );
}
