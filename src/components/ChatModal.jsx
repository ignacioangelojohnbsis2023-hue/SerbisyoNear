import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL, API_BASE_URL_CANDIDATES } from "../lib/api";
import Skeleton from "./ui/Skeleton";

const CHAT_API_CANDIDATES = API_BASE_URL_CANDIDATES;

function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
}

function Avatar({ pictureUrl, name, size = "h-9 w-9" }) {
  const resolvedUrl = resolveMediaUrl(pictureUrl);
  if (resolvedUrl) {
    return <img src={resolvedUrl} alt={name || "User"} className={`${size} rounded-full object-cover`} />;
  }
  const initial = (name || "U").trim().charAt(0).toUpperCase();
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700`}>
      {initial}
    </div>
  );
}

async function callChatApi(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const lastError = { message: "No chat backend available." };
  for (const baseUrl of CHAT_API_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok || data?.status === "success" || data?.status === "error") {
        return data;
      }
      lastError.message = data?.message || `Request failed with status ${res.status}`;
    } catch (error) {
      lastError.message = error?.message || "Network error.";
    }
  }

  throw new Error(lastError.message);
}

export default function ChatModal({ bookingId, currentUser, participantName, participantPicture, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const endRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!bookingId) return;

    async function fetchMessages() {
      try {
        setLoading((prev) => (messages.length === 0 ? true : prev));
        const data = await callChatApi(`/bookings/${bookingId}/messages`);
        if (data.status === "success") {
          const nextMessages = data.messages || [];
          setMessages((prevMessages) => {
            const sameMessages = prevMessages.length === nextMessages.length &&
              prevMessages.every((message, index) => {
                const nextMessage = nextMessages[index];
                return (
                  Number(message.id) === Number(nextMessage?.id) &&
                  message.message === nextMessage?.message &&
                  message.sender_id === nextMessage?.sender_id &&
                  message.is_read === nextMessage?.is_read &&
                  message.created_at === nextMessage?.created_at
                );
              });

            return sameMessages ? prevMessages : nextMessages;
          });
        }
      } catch (error) {
        console.error("Failed to load booking chat", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [bookingId, messages.length]);

  useEffect(() => {
    if (!bookingId || !currentUser?.id) return;

    callChatApi(`/bookings/${bookingId}/messages/read?user_id=${currentUser.id}`, {
      method: "PUT",
    }).catch((error) => console.error("Failed to mark chat messages as read", error));
  }, [bookingId, currentUser?.id]);

  useEffect(() => {
    if (!bookingId || !currentUser?.id) return;

    async function fetchTypingStatus() {
      try {
        const data = await callChatApi(`/bookings/${bookingId}/typing?user_id=${currentUser.id}`);
        if (data.status === "success") {
          const nextTypingUsers = (data.typing || []).filter((user) => Number(user.sender_id) !== Number(currentUser.id));
          setTypingUsers((prevTypingUsers) => {
            const sameTypingUsers = prevTypingUsers.length === nextTypingUsers.length &&
              prevTypingUsers.every((user, index) => {
                const nextUser = nextTypingUsers[index];
                return Number(user.sender_id) === Number(nextUser?.sender_id) && user.sender_name === nextUser?.sender_name;
              });

            return sameTypingUsers ? prevTypingUsers : nextTypingUsers;
          });
        }
      } catch (error) {
        console.error("Typing status fetch failed", error);
      }
    }

    fetchTypingStatus();
    const interval = setInterval(fetchTypingStatus, 1500);
    return () => clearInterval(interval);
  }, [bookingId, currentUser?.id]);

  useEffect(() => {
    if (!messages.length) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendTypingSignal = async (isTyping) => {
    if (!currentUser?.id || !bookingId) return;
    try {
      await callChatApi(`/bookings/${bookingId}/typing`, {
        method: "POST",
        body: JSON.stringify({ sender_id: currentUser.id, is_typing: isTyping }),
      });
    } catch (error) {
      console.error("Typing signal failed", error);
    }
  };

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !currentUser?.id || !bookingId) return;

    try {
      setSending(true);
      await sendTypingSignal(false);
      const data = await callChatApi(`/bookings/${bookingId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          sender_id: currentUser.id,
          message: trimmed,
        }),
      });
      if (data.status === "success") {
        setMessages((prev) => [...prev, data.message]);
        setDraft("");
      } else {
        alert(data.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("Failed to send message", error);
      alert(error?.message || "Something went wrong while sending the message.");
    } finally {
      setSending(false);
      window.clearTimeout(typingTimeoutRef.current);
    }
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  async function handleAttachmentChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !currentUser?.id || !bookingId) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPEG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Image too large. Max 3 MB.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("sender_id", currentUser.id);
      formData.append("file", file);

      const lastError = { message: "No chat backend available." };
      let data = null;
      for (const baseUrl of CHAT_API_CANDIDATES) {
        try {
          const res = await fetch(`${baseUrl}/bookings/${bookingId}/attachments`, {
            method: "POST",
            body: formData,
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok || json?.status === "success" || json?.status === "error") {
            data = json;
            break;
          }
          lastError.message = json?.message || `Request failed with status ${res.status}`;
        } catch (error) {
          lastError.message = error?.message || "Network error.";
        }
      }
      if (!data) throw new Error(lastError.message);

      if (data.status === "success") {
        setMessages((prev) => [...prev, data.message]);
      } else {
        alert(data.message || "Failed to send photo.");
      }
    } catch (error) {
      console.error("Failed to upload attachment", error);
      alert(error?.message || "Something went wrong while sending the photo.");
    } finally {
      setUploading(false);
    }
  }

  function handleDraftChange(event) {
    const nextValue = event.target.value;
    setDraft(nextValue);
    if (!currentUser?.id || !bookingId || !nextValue.trim()) return;
    sendTypingSignal(true);
    window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => sendTypingSignal(false), 1400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar pictureUrl={participantPicture} name={participantName} size="h-10 w-10" />
            <h3 className="text-xl font-extrabold text-slate-900">{participantName || "Conversation"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Close
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-3/4" /><Skeleton className="ml-auto h-12 w-2/3" /><Skeleton className="h-20 w-4/5" /></div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
              No messages yet. Start the conversation.
            </div>
          ) : (
            messages.map((message) => {
              const isMine = Number(message.sender_id) === Number(currentUser?.id);
              return (
                <div key={message.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && <Avatar pictureUrl={participantPicture} name={message.sender_name} size="h-7 w-7" />}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? "bg-teal-700 text-white" : "bg-white text-slate-700"}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${isMine ? "text-teal-100" : "text-slate-400"}`}>
                      {isMine ? "You" : message.sender_name || "User"}
                    </p>
                    {message.attachment_url && (
                      <a href={resolveMediaUrl(message.attachment_url)} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img
                          src={resolveMediaUrl(message.attachment_url)}
                          alt="Attachment"
                          className="max-h-64 w-full rounded-xl object-cover"
                        />
                      </a>
                    )}
                    {message.message && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p>
                    )}
                    <p className={`mt-2 text-[10px] ${isMine ? "text-teal-100/80" : "text-slate-400"}`}>
                      {new Date(message.created_at).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isMine && <span className="ml-2 font-bold" aria-label={message.is_read ? "Seen" : "Sent"}>{message.is_read ? "✓✓" : "✓"}</span>}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm">
                {typingUsers.map((user) => user.sender_name || "Someone").join(", ")} typing...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-4">
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <button
              type="button"
              onClick={handleAttachmentClick}
              disabled={uploading}
              title="Attach photo"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "…" : "📎"}
            </button>
            <textarea
              value={draft}
              onChange={handleDraftChange}
              rows={2}
              placeholder="Type your message..."
              className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
