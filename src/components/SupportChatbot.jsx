import React, { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

export default function SupportChatbot({ open, onClose, role }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I’m SerbisyoNear Support. Ask me about bookings, payments, profiles, or using the app." },
  ]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setMessage("");
    setSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/support/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role: role?.toLowerCase() || "resident",
          history: nextMessages.slice(-8).map((item) => ({ role: item.role, text: item.text })),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Support assistant is unavailable.");
      }
      setMessages((current) => [...current, { role: "assistant", text: data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message }]);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-3 sm:items-center">
      <section className="flex h-[min(620px,calc(100vh-24px))] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-navy-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500"><Bot size={21} /></span>
            <div>
              <h2 className="font-display text-sm font-bold">Help &amp; Support</h2>
              <p className="text-xs text-white/65">SerbisyoNear AI assistant</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close support chat" className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white"><X size={19} /></button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF6EE] p-4">
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${item.role === "user" ? "bg-teal-700 text-white" : "bg-white text-slate-700 shadow-sm"}`}>
                {item.text}
              </p>
            </div>
          ))}
          {sending && <p className="text-xs text-slate-400">Support assistant is typing...</p>}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#E9E2D2] bg-white p-3">
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a question..." className="min-w-0 flex-1 rounded-xl border border-[#E9E2D2] px-3 py-2.5 text-sm outline-none focus:border-teal-500" />
          <button type="submit" disabled={sending || !message.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white disabled:opacity-50"><Send size={17} /></button>
        </form>
      </section>
    </div>
  );
}
