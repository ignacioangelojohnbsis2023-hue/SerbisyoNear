import React, { useEffect, useRef, useState } from "react";
import ResidentLayout from "../components/ResidentLayout";
import { API_BASE_URL } from "../lib/api";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

function formatMemberSince(str) {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleDateString("en-PH", { year: "numeric", month: "long" });
  } catch { return "—"; }
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IconCalendar() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconChevron({ open }) {
  return (
    <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Avatar with upload overlay ────────────────────────────────────────────────
function AvatarUpload({ name, photoUrl, onUpload, uploading }) {
  const fileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <div className="relative mx-auto w-fit">
      <div className="h-20 w-20 rounded-full overflow-hidden ring-4 ring-white shadow-md">
        {photoUrl ? (
          <img
            src={`${API_BASE_URL.replace("/api", "")}${photoUrl}`}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-teal-700 text-2xl font-bold text-white">
            {getInitials(name)}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Change profile picture"
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white shadow-md ring-2 ring-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {uploading ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <IconCamera />
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-200 mb-4" />
          <div className="h-5 w-32 rounded bg-slate-200 mx-auto mb-2" />
          <div className="h-4 w-40 rounded bg-slate-100 mx-auto" />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 rounded bg-slate-100 mb-2" />
              <div className="h-11 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputCls = "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600";
const readonlyCls = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500";

export default function ResidentProfile() {
  const [form, setForm] = useState({
    full_name: "", email: "", role: "", phone: "", address: "", profile_picture: null,
  });
  const [memberSince, setMemberSince] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", new_password: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (!user?.id) { setErrorMessage("User not found. Please log in again."); setLoading(false); return; }
        const res = await fetch(`${API_BASE_URL}/profile/${user.id}`);
        const data = await res.json();
        if (data.status === "success") {
          setForm({
            full_name: data.user.full_name || "",
            email: data.user.email || "",
            role: data.user.role || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
            profile_picture: data.user.profile_picture || null,
          });
          setMemberSince(data.user.created_at || null);
        } else {
          setErrorMessage(data.message || "Failed to load profile.");
        }
      } catch { setErrorMessage("Something went wrong while loading profile."); }
      finally { setLoading(false); }
    }
    fetchProfile();
  }, []);

  // ── Photo upload ───────────────────────────────────────────────────────────
  async function handlePhotoUpload(file) {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/profile/${user.id}/upload-photo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setForm((prev) => ({ ...prev, profile_picture: data.profile_picture }));
        localStorage.setItem("user", JSON.stringify({ ...user, profile_picture: data.profile_picture }));
        setSuccessMessage("Profile picture updated!");
      } else {
        setErrorMessage(data.message || "Failed to upload photo.");
      }
    } catch {
      setErrorMessage("Something went wrong uploading your photo.");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage(""); setSuccessMessage("");
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (!user?.id) return setErrorMessage("User not found.");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone, address: form.address }),
      });
      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("user", JSON.stringify({ ...user, full_name: data.user.full_name }));
        setSuccessMessage("Profile updated successfully.");
      } else {
        setErrorMessage(data.message || "Failed to update profile.");
      }
    } catch { setErrorMessage("Something went wrong."); }
    finally { setSaving(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (pwForm.new_password !== pwForm.confirm) return setPwError("New passwords do not match.");
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (!user?.id) return setPwError("User not found.");
    setPwSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, current_password: pwForm.current, new_password: pwForm.new_password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setPwSuccess("Password changed successfully.");
        setPwForm({ current: "", new_password: "", confirm: "" });
      } else {
        setPwError(data.message || "Failed to change password.");
      }
    } catch { setPwError("Something went wrong."); }
    finally { setPwSaving(false); }
  }

  return (
    <ResidentLayout title="Profile">
      <div className="space-y-6">

        {errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-xs font-semibold hover:underline ml-4">Close</button>
          </div>
        )}

        {loading ? <ProfileSkeleton /> : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-1 space-y-4">

              {/* Avatar Card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
                <AvatarUpload
                  name={form.full_name}
                  photoUrl={form.profile_picture}
                  onUpload={handlePhotoUpload}
                  uploading={uploading}
                />
                <p className="mt-2 text-[10px] text-slate-400">Click the camera icon to change photo</p>
                <h2 className="mt-3 text-lg font-extrabold text-slate-900 break-words">{form.full_name || "—"}</h2>
                <p className="text-sm text-slate-500 mt-1 break-all">{form.email}</p>
                <span className="mt-3 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 capitalize">
                  {form.role}
                </span>
              </div>

              {/* Account Info */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Info</h3>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <IconCalendar />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Member since</p>
                    <p className="text-sm font-semibold text-slate-700">{formatMemberSince(memberSince)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <IconPin />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{form.address || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <IconPhone />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-semibold text-slate-700">{form.phone || "Not set"}</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
                <h3 className="text-sm font-bold text-teal-800 mb-2">Profile Tips</h3>
                <ul className="space-y-1.5 text-xs text-teal-700">
                  <li>Add a profile photo so providers can recognize you easily.</li>
                  <li>Keep your phone number updated so providers can reach you.</li>
                  <li>A complete address helps match you with nearby providers.</li>
                </ul>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Edit Profile */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-extrabold text-slate-900">Edit Profile</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your personal information.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                      className={inputCls} required />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Email</label>
                      <input type="email" value={form.email} readOnly className={readonlyCls} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Role</label>
                      <input type="text" value={form.role} readOnly className={`${readonlyCls} capitalize`} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange}
                      className={inputCls} placeholder="e.g. 09123456789" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Address</label>
                    <textarea name="address" value={form.address} onChange={handleChange} rows={3}
                      className={inputCls} placeholder="Enter your full address" />
                  </div>
                  <button type="submit" disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <button
                  onClick={() => { setShowPwSection(v => !v); setPwError(""); setPwSuccess(""); }}
                  className="flex w-full items-center justify-between text-left">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Change Password</h3>
                    <p className="text-sm text-slate-500">Update your account password.</p>
                  </div>
                  <IconChevron open={showPwSection} />
                </button>

                {showPwSection && (
                  <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                    {pwError && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{pwError}</div>}
                    {pwSuccess && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">{pwSuccess}</div>}

                    <div>
                      <label className="text-sm font-semibold text-slate-700">Current Password</label>
                      <div className="relative mt-2">
                        <input type={showCurrent ? "text" : "password"} value={pwForm.current}
                          onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                          placeholder="Enter current password" required />
                        <button type="button" onClick={() => setShowCurrent(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium">
                          {showCurrent ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-semibold text-slate-700">New Password</label>
                        <div className="relative mt-2">
                          <input type={showNew ? "text" : "password"} value={pwForm.new_password}
                            onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                            placeholder="Min 8 chars" required />
                          <button type="button" onClick={() => setShowNew(v => !v)}
                            className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium">
                            {showNew ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                        <div className="relative mt-2">
                          <input type={showConfirm ? "text" : "password"} value={pwForm.confirm}
                            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                            placeholder="Re-enter password" required />
                          <button type="button" onClick={() => setShowConfirm(v => !v)}
                            className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium">
                            {showConfirm ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={pwSaving}
                      className="w-full sm:w-auto rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition">
                      {pwSaving ? "Saving..." : "Change Password"}
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </ResidentLayout>
  );
}
