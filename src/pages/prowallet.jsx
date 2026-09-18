import React, { useEffect, useState } from "react";
import ProLayout from "../components/ProLayout";
import { API_BASE_URL } from "../lib/api";
import Skeleton from "../components/ui/Skeleton";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const transactionLabel = (type) => ({
  top_up: "Top Up",
  commission_deduction: "Commission Deduction",
  refund: "Refund",
  earning: "Earning",
  fee: "Fee",
}[type] || String(type || "").replaceAll("_", " "));

export default function ProWallet() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [amount, setAmount] = useState("300");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  async function loadWallet() {
    if (!user?.id) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/pro/wallet/${user.id}/top-up/reconcile`, { method: "POST" });
      const response = await fetch(`${API_BASE_URL}/pro/wallet/${user.id}`);
      const data = await response.json();
      if (data.status === "success") setWallet({ balance: data.balance || 0, transactions: data.transactions || [] });
      else setMessage(data.message || "Unable to load wallet.");
    } catch {
      setMessage("Unable to connect to the wallet service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWallet(); }, []);

  async function topUp(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 100) {
      setMessage("Enter a top-up amount of at least ₱100.00.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pro/wallet/${user.id}/top-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      const data = await response.json();
      if (data.status !== "success") throw new Error(data.message || "Unable to start top-up.");
      if (data.checkout_url) {
        localStorage.setItem("pending_wallet_payment_id", data.payment_id);
        window.location.href = data.checkout_url;
      }
      else setMessage("Top-up started. Your balance will update after payment confirmation.");
      setTopUpOpen(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProLayout title="Wallet" headerEyebrow="Provider Finances" headerSubtitle="Keep your commission balance ready so you can accept new jobs.">
      <div className="mx-auto max-w-4xl space-y-5">
        {message && <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{message}</span><button type="button" onClick={loadWallet} className="font-semibold underline">Retry</button></div>}
        <section className={`rounded-3xl p-6 text-white shadow-sm ${wallet.balance < 100 ? "bg-gradient-to-br from-orange-600 to-red-500" : "bg-gradient-to-br from-teal-800 to-teal-600"}`}>
          <p className="text-sm text-white/75">Available balance</p>
          <p className="mt-2 text-4xl font-extrabold">{loading ? <Skeleton className="h-10 w-32 bg-white/30" /> : money(wallet.balance)}</p>
          <p className="mt-2 text-sm text-white/80">{wallet.balance < 100 ? "Low balance — top up to keep accepting jobs" : "Available for commission"}</p>
          <button type="button" onClick={() => setTopUpOpen(true)} className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-800">Top Up</button>
        </section>
        <section className="prototype-card overflow-hidden">
          <div className="border-b border-[#E9E2D2] p-5"><h2 className="font-display text-lg font-bold text-slate-900">Transaction Log</h2><p className="mt-1 text-sm text-slate-500">Your append-only commission and top-up history.</p></div>
          {loading ? <div className="space-y-3 p-5"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : wallet.transactions.length === 0 ? <div className="p-10 text-center text-sm text-slate-500"><div className="text-3xl">💳</div><p className="mt-2">No wallet activity yet. Top up before accepting your first job.</p></div> : (
            <div className="divide-y divide-[#E9E2D2]">{wallet.transactions.map((item) => (
              <div key={item.transaction_id || item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 p-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.type_label || transactionLabel(item.type)}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.timestamp || item.created_at ? new Date(item.timestamp || item.created_at).toLocaleString() : "—"}{item.related_booking_id || item.booking_id ? ` · Booking #${item.related_booking_id || item.booking_id}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className={`whitespace-nowrap text-sm font-bold ${Number(item.amount) >= 0 ? "text-emerald-700" : "text-red-600"}`}>{Number(item.amount) >= 0 ? "+" : ""}{money(item.amount)}</p>
                  <p className="mt-1 whitespace-nowrap text-xs text-slate-500">{item.status} · Balance {money(item.resulting_balance ?? item.balance_after)}</p>
                </div>
              </div>
            ))}</div>
          )}
        </section>
      </div>
      {topUpOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"><form onSubmit={topUp} className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"><h2 className="font-display text-lg font-bold text-slate-900">Top up wallet</h2><p className="mt-1 text-sm text-slate-500">Choose an amount to continue to PayMongo checkout.</p>      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">{[100, 300, 500].map((preset) => <button type="button" key={preset} onClick={() => setAmount(String(preset))} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${amount === String(preset) ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}>{money(preset)}</button>)}</div><input type="number" min="100" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Custom amount" /><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => setTopUpOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white">{saving ? "Starting..." : "Continue to payment"}</button></div></form></div>}
    </ProLayout>
  );
}
