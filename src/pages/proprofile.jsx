import React, { useEffect, useRef, useState } from "react";
import ProLayout from "../components/ProLayout";
import { API_BASE_URL } from "../lib/api";
import MapComponent from "../components/MapComponent";
import { reverseGeocode } from "../lib/geocode";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}

function formatDate(str) {
  if (!str) return "-";
  try {
    return new Date(str).toLocaleString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return str; }
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconPhone() {
  return (
    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
function IconCamera() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconStar({ filled }) {
  return (
    <svg className={`w-4 h-4 ${filled ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.538 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.783.57-1.838-.197-1.538-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
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
function IconWarning() {
  return (
    <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
      {/* Circle */}
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

      {/* Camera button */}
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-200 mb-4" />
          <div className="h-5 w-32 rounded bg-slate-200 mx-auto mb-2" />
          <div className="h-4 w-40 rounded bg-slate-100 mx-auto mb-3" />
          <div className="flex justify-center gap-2">
            <div className="h-6 w-16 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-12 rounded bg-slate-100" />
                <div className="h-4 w-32 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
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

export default function ProProfile() {
  const [form, setForm] = useState({
    full_name: "", email: "", role: "", phone: "",
    address: "", verification_status: "", lat: null, lon: null,
    profile_picture: null,
  });
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesOpen, setServicesOpen] = useState(false);
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

  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackTab, setFeedbackTab] = useState("all");

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        if (!user?.id) { setErrorMessage("User not found. Please log in again."); setLoading(false); return; }

        const [profileRes, servicesRes, selectedRes] = await Promise.all([
          fetch(`${API_BASE_URL}/profile/${user.id}`),
          fetch(`${API_BASE_URL}/services`),
          fetch(`${API_BASE_URL}/profile/${user.id}/services`),
        ]);

        const profileData = await profileRes.json();
        const servicesData = await servicesRes.json();
        const selectedData = await selectedRes.json();

        if (profileData.status === "success") {
          setForm({
            full_name: profileData.user.full_name || "",
            email: profileData.user.email || "",
            role: profileData.user.role || "",
            phone: profileData.user.phone || "",
            address: profileData.user.address || "",
            verification_status: profileData.user.verification_status || "",
            lat: profileData.user.lat || null,
            lon: profileData.user.lon || null,
            profile_picture: profileData.user.profile_picture || null,
          });
        } else {
          setErrorMessage(profileData.message || "Failed to load profile.");
        }

        if (servicesData.status === "success") setServices(servicesData.services);
        if (selectedData.status === "success") setSelectedServices(selectedData.services || []);

        const feedbackRes = await fetch(`${API_BASE_URL}/pro/feedbacks/${user.id}`);
        const feedbackData = await feedbackRes.json();
        if (feedbackData.status === "success") {
          setFeedbacks(feedbackData.feedbacks);
          setAvgRating(feedbackData.avg_rating);
          setTotalFeedbacks(feedbackData.total);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading profile.");
      } finally {
        setLoading(false);
        setFeedbackLoading(false);
      }
    }
    fetchProfileData();
  }, []);

  // ── Profile picture upload ─────────────────────────────────────────────────
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
        // Persist in localStorage so navbar picks it up immediately
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

  function handleServiceToggle(serviceId) {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === serviceId);
      if (exists) return prev.filter((s) => s.id !== serviceId);
      return [...prev, { id: serviceId, price: 500 }];
    });
  }

  function handlePriceChange(serviceId, price) {
    setSelectedServices((prev) =>
      prev.map((s) => s.id === serviceId ? { ...s, price: Number(price) } : s)
    );
  }

  function removeService(serviceId) {
    setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId));
  }

  async function handleMapClick(lat, lon) {
    setForm((prev) => ({ ...prev, lat, lon }));
    try {
      const address = await reverseGeocode(lat, lon);
      setForm((prev) => ({ ...prev, address }));
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    if (!form.full_name.trim()) return setErrorMessage("Full name is required.");
    if (!form.phone.trim()) return setErrorMessage("Phone number is required.");
    if (!form.address.trim()) return setErrorMessage("Address is required.");
    if (selectedServices.length === 0) return setErrorMessage("Select at least one service.");
    setSaving(true);
    try {
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (!user?.id) return setErrorMessage("User not found.");

      const profileRes = await fetch(`${API_BASE_URL}/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, phone: form.phone, address: form.address, lat: form.lat, lon: form.lon }),
      });
      const profileData = await profileRes.json();
      if (profileData.status !== "success") return setErrorMessage(profileData.message || "Failed to update profile.");

      const servicesRes = await fetch(`${API_BASE_URL}/profile/${user.id}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: selectedServices }),
      });
      const servicesData = await servicesRes.json();
      if (servicesData.status !== "success") return setErrorMessage(servicesData.message || "Failed to update services.");

      localStorage.setItem("user", JSON.stringify({
        ...user,
        full_name: profileData.user.full_name,
        lat: form.lat,
        lon: form.lon,
      }));
      setSuccessMessage("Profile updated successfully!");
      setServicesOpen(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (pwForm.new_password !== pwForm.confirm) return setPwError("New passwords do not match.");
    const user = JSON.parse(localStorage.getItem("user") || "null");
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

  function getStatusBadge(status) {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "pending") return "bg-amber-100 text-amber-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  }

  function serviceName(id) {
    return services.find((s) => s.id === id)?.name || "Unknown";
  }

  const filteredFeedbacks = feedbackTab === "complaints"
    ? feedbacks.filter((f) => f.is_complaint)
    : feedbacks;
  const complaintCount = feedbacks.filter((f) => f.is_complaint).length;

  return (
    <ProLayout title="Profile">
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
            <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start space-y-4">

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
                <div className="mt-3 flex justify-center gap-2 flex-wrap">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 capitalize">{form.role}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(form.verification_status)}`}>
                    {form.verification_status || "unknown"}
                  </span>
                </div>
              </div>

              {/* Ratings */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">My Ratings</h3>
                {totalFeedbacks > 0 ? (
                  <div className="text-center">
                    <div className="text-4xl font-extrabold text-amber-500">{avgRating}</div>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => <IconStar key={s} filled={s <= Math.round(avgRating)} />)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{totalFeedbacks} review{totalFeedbacks > 1 ? "s" : ""}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No ratings yet.</p>
                )}
              </div>

              {/* Account Info */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Info</h3>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <IconPhone />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm font-semibold text-slate-700">{form.phone || "Not set"}</p>
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
              </div>

              {/* Tips */}
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
                <h3 className="text-sm font-bold text-teal-800 mb-2">Provider Tips</h3>
                <ul className="space-y-1.5 text-xs text-teal-700">
                  <li>Add a clear profile photo to build trust with residents.</li>
                  <li>Pin your exact location so residents can find you nearby.</li>
                  <li>Select all services you offer to appear in more searches.</li>
                  <li>Keep your phone updated so residents can confirm bookings.</li>
                </ul>
              </div>

              {/* Change Password */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <button
                  onClick={() => { setShowPwSection(v => !v); setPwError(""); setPwSuccess(""); }}
                  className="flex w-full items-center justify-between text-left">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Change Password</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Update your account password.</p>
                  </div>
                  <IconChevron open={showPwSection} />
                </button>
                {showPwSection && (
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                    {pwError && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{pwError}</div>}
                    {pwSuccess && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700">{pwSuccess}</div>}
                    {[
                      { label: "Current Password", key: "current", show: showCurrent, toggle: () => setShowCurrent(v => !v), placeholder: "Current password" },
                      { label: "New Password", key: "new_password", show: showNew, toggle: () => setShowNew(v => !v), placeholder: "Min 8 chars" },
                      { label: "Confirm New Password", key: "confirm", show: showConfirm, toggle: () => setShowConfirm(v => !v), placeholder: "Re-enter password" },
                    ].map(({ label, key, show, toggle, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold text-slate-700">{label}</label>
                        <div className="relative mt-1.5">
                          <input
                            type={show ? "text" : "password"}
                            value={pwForm[key]}
                            onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                            placeholder={placeholder}
                            required
                          />
                          <button type="button" onClick={toggle}
                            className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 hover:text-slate-700 font-medium">
                            {show ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="submit" disabled={pwSaving}
                      className="w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition">
                      {pwSaving ? "Saving..." : "Change Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-extrabold text-slate-900">Edit Profile</h2>
                  <p className="text-sm text-slate-500 mt-1">Update your provider information and service area.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange} className={inputCls} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Email</label>
                      <input type="email" value={form.email} readOnly className={readonlyCls} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Phone</label>
                      <input type="text" name="phone" value={form.phone} onChange={handleChange}
                        className={inputCls} placeholder="Enter phone number" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Address</label>
                    <input type="text" name="address" value={form.address} onChange={handleChange}
                      className={inputCls} placeholder="Enter address" />
                  </div>

                  {/* Map */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Set My Exact Location</label>
                    <p className="text-xs text-slate-500 mt-1">Click on the map to pin your precise location.</p>
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200">
                      <MapComponent
                        lat={form.lat || 14.6760} lon={form.lon || 121.0437}
                        markers={form.lat && form.lon ? [{ id: 1, lat: form.lat, lon: form.lon, label: "My Location" }] : []}
                        onMapClick={handleMapClick}
                      />
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Services Offered</label>

                    {selectedServices.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedServices.map((sel) => (
                          <div key={sel.id}
                            className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 pl-3 pr-1.5 py-1">
                            <span className="text-xs font-semibold text-teal-700">{serviceName(sel.id)}</span>
                            <span className="text-xs text-teal-400">·</span>
                            <span className="text-xs text-teal-500">₱</span>
                            <input
                              type="number" min="0" value={sel.price}
                              onChange={(e) => handlePriceChange(sel.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-14 rounded-full border border-teal-200 bg-white px-2 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <button type="button" onClick={() => removeService(sel.id)}
                              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-200 text-teal-700 hover:bg-red-100 hover:text-red-600 text-xs font-bold">
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">No services selected yet.</p>
                    )}

                    <button type="button" onClick={() => setServicesOpen(v => !v)}
                      className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:border-teal-400">
                      <span>{servicesOpen ? "Hide Services" : "Select Services"}</span>
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                        {selectedServices.length} selected
                      </span>
                    </button>

                    {servicesOpen && (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-xs text-slate-500">
                          Check services you offer. Set your rate per service in the tags above.
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {services.map((service) => {
                            const isChecked = !!selectedServices.find((s) => s.id === service.id);
                            return (
                              <label key={service.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
                                  isChecked
                                    ? "border-teal-500 bg-teal-50 text-teal-800"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                                }`}>
                                <input type="checkbox" checked={isChecked}
                                  onChange={() => handleServiceToggle(service.id)}
                                  className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs font-medium leading-tight">{service.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <button type="button" onClick={() => setServicesOpen(false)}
                          className="mt-4 w-full rounded-xl bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                          Done
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={saving}
                    className="w-full sm:w-auto rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── Ratings & Feedback ── */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">My Ratings & Feedback</h2>
              <p className="text-sm text-slate-500 mt-1">Feedback received from residents after completed bookings.</p>
            </div>
            {totalFeedbacks > 0 && (
              <div className="flex flex-col items-center rounded-2xl bg-amber-50 px-5 py-3 text-center flex-shrink-0">
                <div className="text-3xl font-extrabold text-amber-500">{avgRating}</div>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(s => <IconStar key={s} filled={s <= Math.round(avgRating)} />)}
                </div>
                <div className="mt-1 text-xs text-slate-500">{totalFeedbacks} review{totalFeedbacks > 1 ? "s" : ""}</div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-5 flex-wrap">
            <button onClick={() => setFeedbackTab("all")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                feedbackTab === "all" ? "bg-teal-700 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              All ({feedbacks.length})
            </button>
            <button onClick={() => setFeedbackTab("complaints")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                feedbackTab === "complaints" ? "bg-red-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              Complaints ({complaintCount})
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {feedbackLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 animate-pulse">
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="h-4 w-4 rounded bg-slate-200" />
                      ))}
                    </div>
                    <div className="h-4 w-full rounded bg-slate-200 mb-2" />
                    <div className="h-3 w-48 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
                <p className="text-slate-400 text-sm">
                  {feedbackTab === "complaints"
                    ? "No complaints received. Great job!"
                    : "No feedback yet. Complete bookings to receive ratings."}
                </p>
              </div>
            ) : (
              filteredFeedbacks.map((fb) => (
                <div key={fb.id}
                  className={`rounded-2xl border p-4 ${fb.is_complaint ? "border-red-100 bg-red-50" : "border-slate-100 bg-slate-50"}`}>
                  {fb.is_complaint && (
                    <span className="mb-2 inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-xs font-bold text-red-600">
                      <IconWarning /> Complaint
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <IconStar key={s} filled={s <= fb.rating} />)}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{fb.rating}/5</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {fb.comment || <span className="italic text-slate-400">No comment provided.</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>{fb.resident_name}</span>
                    <span>Booking #{fb.booking_id}</span>
                    <span>{formatDate(fb.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </ProLayout>
  );
}
