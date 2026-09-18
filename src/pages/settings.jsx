import React, { useState } from "react";
import { Mail, MessageCircle, ShieldCheck, Trash2 } from "lucide-react";
import ResidentLayout from "../components/ResidentLayout";
import ProLayout from "../components/ProLayout";
import AdminLayout from "../components/AdminLayout";
import SupportChatbot from "../components/SupportChatbot";
import { API_BASE_URL } from "../lib/api";

const ROLE_CONFIG = {
  resident: { Layout: ResidentLayout, label: "Resident" },
  pro: { Layout: ProLayout, label: "Pro" },
  admin: { Layout: AdminLayout, label: "Admin" },
};

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500";
const TERMS_TEXT = `Welcome to SerbisyoNear. By creating an account, you agree to the following:

1. ACCOUNT RESPONSIBILITY
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

2. ACCURATE INFORMATION
You agree to provide accurate, current, and complete information and to keep your profile updated.

3. SERVICE MATCHING ONLY
SerbisyoNear connects residents with household and maintenance service providers. We do not employ providers and are not responsible for the quality or outcome of services rendered.

4. PROHIBITED CONDUCT
Users must not misuse the platform, submit false information, harass other users, or engage in fraudulent activity.

5. LIMITATION OF LIABILITY
SerbisyoNear is not liable for disputes, damages, or losses arising from transactions between residents and service providers.`;

const PRIVACY_TEXT = `SerbisyoNear collects the information needed to create your account, match you with nearby providers, process bookings, and provide support.

We do not sell your personal information to third parties. Your information may be shared with relevant service providers only when needed to facilitate a booking or support request.

You may update your account and service-area information from Settings. You may also request account deactivation through the Delete account option.`;

export default function SettingsPage({ role }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { Layout, label } = ROLE_CONFIG[role] || ROLE_CONFIG.resident;
  const [account, setAccount] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [location, setLocation] = useState({
    region: user?.region || "Metro Manila",
    city: user?.city || "",
    barangay: user?.barangay || "",
    address: user?.address || "",
  });
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  function showNotice(type, text) {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4500);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!user?.id) return showNotice("error", "Your session has expired. Please sign in again.");
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...account, ...location }),
      });
      const data = await response.json();
      if (!response.ok || data.status !== "success") throw new Error(data.message || "Unable to save your details.");
      const updated = { ...user, ...account, ...location, ...(data.user || {}) };
      localStorage.setItem("user", JSON.stringify(updated));
      showNotice("success", "Account and service area updated.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (password.next !== password.confirm) return showNotice("error", "New passwords do not match.");
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, current_password: password.current, new_password: password.next }),
      });
      const data = await response.json();
      if (data.status !== "success") throw new Error(data.message || "Could not update your password.");
      setPassword({ current: "", next: "", confirm: "" });
      showNotice("success", data.message || "Password updated successfully.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    try {
      const response = await fetch(`${API_BASE_URL}/account/${user.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || data.status !== "success") throw new Error(data.message || "Unable to delete account.");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch (error) {
      setDeleteOpen(false);
      showNotice("error", error.message);
    }
  }

  return (
    <Layout title="Settings" headerEyebrow="Account" headerSubtitle="Manage your account, service area, and security.">
      <div className="mx-auto max-w-3xl space-y-5">
        {notice && <div className={`rounded-xl p-3 text-sm ${notice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{notice.text}</div>}

        <section className="prototype-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Account</h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <input required value={account.full_name} onChange={(e) => setAccount({ ...account, full_name: e.target.value })} placeholder="Full name" className={inputClass} />
            <div className="grid gap-4 sm:grid-cols-2">
              <input required type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="Email address" className={inputClass} />
              <input value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} placeholder="Phone number" className={inputClass} />
            </div>
            <button disabled={saving} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save account details"}</button>
          </form>
          <button type="button" onClick={() => setDeleteOpen(true)} className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#D9694E]"><Trash2 size={16} /> Delete account</button>
        </section>

        <section className="prototype-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Location &amp; Service Area</h2>
          <p className="mt-1 text-sm text-slate-500">This address is used to match you with nearby providers.</p>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <select value={location.region} onChange={(e) => setLocation({ ...location, region: e.target.value })} className={inputClass}><option>Metro Manila</option></select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input required value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} placeholder="City / municipality" className={inputClass} />
              <input required value={location.barangay} onChange={(e) => setLocation({ ...location, barangay: e.target.value })} placeholder="Barangay" className={inputClass} />
            </div>
            <input value={location.address} onChange={(e) => setLocation({ ...location, address: e.target.value })} placeholder="Street / complete address" className={inputClass} />
            <button disabled={saving} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save service area"}</button>
          </form>
        </section>

        <section className="prototype-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-teal-700" /><h2 className="font-display text-lg font-bold text-slate-900">Security</h2></div>
          <p className="mt-1 text-sm text-slate-500">Change your password regularly to keep your account safe.</p>
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <input type="password" required value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} placeholder="Current password" className={inputClass} />
            <div className="grid gap-4 sm:grid-cols-2"><input type="password" required value={password.next} onChange={(e) => setPassword({ ...password, next: e.target.value })} placeholder="New password" className={inputClass} /><input type="password" required value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} placeholder="Confirm new password" className={inputClass} /></div>
            <button disabled={saving} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Updating..." : "Update password"}</button>
          </form>
        </section>

        <section className="prototype-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Help &amp; Support</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setFaqOpen(true)} className="rounded-xl border border-slate-200 p-4 text-left text-sm font-semibold text-slate-700">Frequently asked questions</button>
            <button type="button" onClick={() => setChatOpen(true)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-left text-sm font-semibold text-slate-700"><MessageCircle size={17} className="text-teal-700" /> Open AI support chat</button>
            <a href="mailto:support@serbisyonear.com" className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-slate-700"><Mail size={17} className="text-teal-700" /> Contact support</a>
            <a href="mailto:support@serbisyonear.com?subject=SerbisyoNear%20problem%20report" className="rounded-xl border border-slate-200 p-4 text-left text-sm font-semibold text-slate-700">Report a problem</a>
          </div>
        </section>

        <section className="prototype-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-slate-900">About</h2>
          <p className="mt-2 text-sm text-slate-500">SerbisyoNear v1.0.0 · {label} account</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-teal-700"><button type="button" onClick={() => setTermsOpen(true)} className="underline underline-offset-2">Terms of Service</button><button type="button" onClick={() => setPrivacyOpen(true)} className="underline underline-offset-2">Privacy Policy</button></div>
        </section>

        <section className="rounded-2xl border border-[#E9B4A5] bg-[#FFF7F4] p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-[#A94732]">Log out</h2>
          <p className="mt-1 text-sm text-[#A94732]/75">End your current session on this device.</p>
          <button type="button" onClick={() => setLogoutOpen(true)} className="mt-4 rounded-xl border border-[#D9694E] px-5 py-3 text-sm font-semibold text-[#D9694E]">Log out of SerbisyoNear</button>
        </section>
      </div>

      <SupportChatbot open={chatOpen} onClose={() => setChatOpen(false)} role={label} />
      {faqOpen && <Modal title="Frequently asked questions" onClose={() => setFaqOpen(false)}><p><strong>How do I book a provider?</strong><br />Browse services, select a provider, and choose an available schedule.</p><p><strong>How do I update my service area?</strong><br />Use the Location &amp; Service Area section above. Changes are used for provider matching.</p><p><strong>Need more help?</strong><br />Contact support or open the AI support chat.</p></Modal>}
      {deleteOpen && <Modal title="Delete account?" onClose={() => setDeleteOpen(false)}><p>This will deactivate your account and remove it from active use. This action cannot be undone from the app.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setDeleteOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={deleteAccount} className="flex-1 rounded-xl bg-[#D9694E] px-4 py-3 text-sm font-semibold text-white">Delete account</button></div></Modal>}
      {logoutOpen && <Modal title="Log out?" onClose={() => setLogoutOpen(false)}><p>You can sign back in anytime to continue using SerbisyoNear.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setLogoutOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={() => { localStorage.removeItem("user"); window.location.href = "/login"; }} className="flex-1 rounded-xl bg-[#D9694E] px-4 py-3 text-sm font-semibold text-white">Log out</button></div></Modal>}
      {termsOpen && <PolicyModal title="Terms of Service" text={TERMS_TEXT} onClose={() => setTermsOpen(false)} />}
      {privacyOpen && <PolicyModal title="Privacy Policy" text={PRIVACY_TEXT} onClose={() => setPrivacyOpen(false)} />}
    </Layout>
  );
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"><div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-slate-900">{title}</h2><button type="button" onClick={onClose} className="text-sm font-semibold text-slate-400">Close</button></div><div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600">{children}</div></div></div>;
}

function PolicyModal({ title, text, onClose }) {
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4"><div className="flex max-h-[95vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white p-5 shadow-2xl sm:max-h-[min(720px,calc(100vh-32px))] sm:rounded-3xl sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-slate-900">{title}</h2><button type="button" onClick={onClose} className="text-sm font-semibold text-slate-400">Close</button></div><pre className="mt-5 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-600">{text}</pre></div></div>;
}
