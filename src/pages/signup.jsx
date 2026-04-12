import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../lib/api";

// ── helpers ───────────────────────────────────────────────────────────────────
function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least 1 uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least 1 lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least 1 number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least 1 special character.";
  if (new TextEncoder().encode(password).length > 72) return "Password is too long. Max 72 bytes.";
  return "";
}

const PSGC = "https://psgc.cloud/api";
async function fetchRegions() {
  const res = await fetch(`${PSGC}/regions`);
  return res.json();
}
async function fetchProvinces(regionCode) {
  const res = await fetch(`${PSGC}/regions/${regionCode}/provinces`);
  return res.json();
}
async function fetchCities(provinceCode) {
  const res = await fetch(`${PSGC}/provinces/${provinceCode}/cities-municipalities`);
  return res.json();
}
async function fetchCitiesByRegion(regionCode) {
  const res = await fetch(`${PSGC}/regions/${regionCode}/cities-municipalities`);
  return res.json();
}
async function fetchBarangays(cityCode) {
  const res = await fetch(`${PSGC}/cities-municipalities/${cityCode}/barangays`);
  return res.json();
}

const TERMS = `Welcome to SerbisyoNear. By creating an account, you agree to the following:

1. ACCOUNT RESPONSIBILITY
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

2. ACCURATE INFORMATION
You agree to provide accurate, current, and complete information during registration and to keep your profile updated.

3. SERVICE MATCHING ONLY
SerbisyoNear is a platform for connecting residents with household and maintenance service providers. We do not employ service providers and are not responsible for the quality or outcome of services rendered.

4. VERIFIED PROVIDERS
Service providers must undergo admin verification before being listed on the platform. Verification is based on submitted information only.

5. PROHIBITED CONDUCT
Users must not misuse the platform, submit false information, harass other users, or engage in fraudulent activity. Violations may result in account suspension.

6. PRIVACY
Your personal information is collected to facilitate service matching. We do not sell your data to third parties.

7. LIMITATION OF LIABILITY
SerbisyoNear is not liable for any disputes, damages, or losses arising from transactions between residents and service providers.

8. CHANGES TO TERMS
We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.

By clicking "Create Account", you confirm that you have read, understood, and agree to these Terms and Conditions.`;

const CREDENTIAL_TYPES = [
  {
    key: "government_id",
    label: "Government-Issued ID",
    required: true,
    hint: "SSS, GSIS, PhilHealth, Passport, Driver's License, Voter's ID, etc.",
  },
  {
    key: "diploma",
    label: "Diploma / Academic Certificate",
    required: false,
    hint: "TESDA NC, vocational diploma, or any academic credential",
  },
  {
    key: "certificate",
    label: "Skills / Trade Certificate",
    required: false,
    hint: "Trade license, skills cert, company training certificate",
  },
];

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

// ── sub-components ────────────────────────────────────────────────────────────
function RoleCard({ active, title, subtitle, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border p-5 text-center transition",
        active
          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-100"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
      ].join(" ")}
    >
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <span className="text-lg">{icon}</span>
      </div>
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500">{subtitle}</div>
    </button>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            "h-2 rounded-full transition-all duration-300",
            i < current
              ? "w-6 bg-teal-700"
              : i === current
              ? "w-8 bg-teal-500"
              : "w-2 bg-slate-200",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white";
const selectCls =
  "w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-slate-700 disabled:bg-slate-50 disabled:text-slate-400";

// ── main component ────────────────────────────────────────────────────────────
export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Step 0 fields
  const [role, setRole] = useState("resident");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 1 — Address dropdowns
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [region, setRegion] = useState("");
  const [regionName, setRegionName] = useState("");
  const [province, setProvince] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [city, setCity] = useState("");
  const [cityName, setCityName] = useState("");
  const [barangay, setBarangay] = useState("");
  const [barangayName, setBarangayName] = useState("");
  const [street, setStreet] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Step 1 — Password + Terms
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Step 2 — Credentials (provider only)
  const [credentials, setCredentials] = useState({ government_id: null, diploma: null, certificate: null });
  const [previews, setPreviews] = useState({});

  const isProvider = role === "provider";
  const totalSteps = isProvider ? 3 : 2;
  const stepLabels = isProvider
    ? ["Personal Info", "Address & Password", "Credentials"]
    : ["Personal Info", "Address & Password"];

  // Load regions once
  useEffect(() => {
    fetchRegions()
      .then((data) => setRegions(Array.isArray(data) ? data : []))
      .catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    if (!region) { setProvinces([]); setCities([]); setBarangays([]); return; }
    setLoadingProvinces(true);
    setProvince(""); setProvinceName(""); setCity(""); setCityName(""); setBarangay(""); setBarangayName("");
    fetchProvinces(region)
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setProvinces(list);
        if (list.length === 0) {
          setProvince("NONE");
          setProvinceName("N/A");
          setLoadingCities(true);
          fetchCitiesByRegion(region)
            .then((c) => setCities(Array.isArray(c) ? c : []))
            .catch(() => setCities([]))
            .finally(() => setLoadingCities(false));
        }
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, [region]);

  useEffect(() => {
    if (!province || province === "NONE") return;
    setLoadingCities(true);
    setCity(""); setCityName(""); setBarangay(""); setBarangayName("");
    fetchCities(province)
      .then((d) => setCities(Array.isArray(d) ? d : []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [province]);

  useEffect(() => {
    if (!city) { setBarangays([]); return; }
    setLoadingBarangays(true);
    setBarangay("");
    fetchBarangays(city)
      .then((d) => setBarangays(Array.isArray(d) ? d : []))
      .catch(() => setBarangays([]))
      .finally(() => setLoadingBarangays(false));
  }, [city]);

  // ── file handler ───────────────────────────────────────────────────────────
  function handleFileChange(docType, e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) { setError("Only JPEG, PNG, WEBP, or PDF files are allowed."); return; }
    if (file.size > MAX_BYTES) { setError("File must be under 5 MB."); return; }
    setError("");
    setCredentials((c) => ({ ...c, [docType]: file }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((p) => ({ ...p, [docType]: { type: "image", src: ev.target.result } }));
      reader.readAsDataURL(file);
    } else {
      setPreviews((p) => ({ ...p, [docType]: { type: "pdf", name: file.name } }));
    }
  }

  function removeFile(docType) {
    setCredentials((c) => ({ ...c, [docType]: null }));
    setPreviews((p) => ({ ...p, [docType]: null }));
  }

  // ── step 0 → 1 ────────────────────────────────────────────────────────────
  function goNext() {
    setError("");
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim()) { setError("Last name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email."); return; }
    if (isProvider && !phone.trim()) { setError("Phone number is required for providers."); return; }
    if (isProvider && !/^09\d{9}$/.test(phone)) { setError("Phone number must start with 09 and be 11 digits."); return; }
    setStep(1);
  }

  // ── validate step 1 fields (shared by both paths) ─────────────────────────
  function validateStep1() {
    if (!region) { setError("Please select a region."); return false; }
    if (!province) { setError("Please select a province."); return false; }
    if (!city) { setError("Please select a city/municipality."); return false; }
    if (!barangay) { setError("Please select a barangay."); return false; }
    if (!street.trim()) { setError("Please enter your street / house number."); return false; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return false; }
    if (password !== confirm) { setError("Passwords do not match."); return false; }
    if (!agreedToTerms) { setError("You must agree to the Terms and Conditions."); return false; }
    return true;
  }

  // ── step 1 → 2 (providers only) ───────────────────────────────────────────
  function goToCredentials(e) {
    e.preventDefault();
    setError("");
    if (!validateStep1()) return;
    setStep(2);
  }

  // ── final submit ───────────────────────────────────────────────────────────
  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // residents submit from step 1, so validate here
    if (!isProvider && !validateStep1()) return;

    // providers must have uploaded a gov ID
    if (isProvider && !credentials.government_id) {
      setError("A Government-Issued ID photo is required.");
      return;
    }

    const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const fullAddress = [street.trim(), barangayName, cityName, provinceName, regionName].filter(Boolean).join(", ");

    setLoading(true);
    try {
      // 1. Create account
      const res = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          email,
          password,
          role: isProvider ? "pro" : "resident",
          phone: phone.trim() || null,
          address: fullAddress,
          region: regionName,
          province: provinceName,
          city: cityName,
          barangay: barangayName,
          street: street.trim(),
        }),
      });

      const data = await res.json();
      if (data.status !== "success") { setError(data.message || "Signup failed."); setLoading(false); return; }

      // 2. Upload credential docs (providers only)
      const newUserId = data.user?.id;
      if (isProvider && newUserId) {
        for (const { key } of CREDENTIAL_TYPES) {
          const file = credentials[key];
          if (!file) continue;
          const fd = new FormData();
          fd.append("provider_id", newUserId);
          fd.append("doc_type", key);
          fd.append("file", file);
          await fetch(`${API_BASE_URL}/provider/documents/upload`, { method: "POST", body: fd });
        }
      }

      setSuccess("Account created! Please check your email to verify your account.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      leftTitle="Join SerbisyoNear"
      leftSubtitle="Connect with trusted professionals in Metro Manila"
    >
      <BackToHome />

      <h1 className="text-center text-4xl font-extrabold text-slate-900">Create Account</h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Step {step + 1} of {totalSteps} — {stepLabels[step]}
      </p>

      <StepIndicator current={step} total={totalSteps} />

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* ── STEP 0: Role + Personal Info ────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <div className="text-center text-xs font-semibold text-slate-500">I want to…</div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <RoleCard active={role === "resident"} title="Need a Service" subtitle="I'm a Resident" icon="👤" onClick={() => setRole("resident")} />
              <RoleCard active={role === "provider"} title="Offer Services" subtitle="I'm a Provider" icon="👥" onClick={() => setRole("provider")} />
            </div>
            {isProvider && (
              <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
                ⚠️ Provider accounts require admin approval and credential verification before going live.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *">
              <input className={inputCls} placeholder="Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last Name *">
              <input className={inputCls} placeholder="Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>

          <Field label="Middle Name (optional)">
            <input className={inputCls} placeholder="Santos" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </Field>

          <Field label="Email *">
            <input className={inputCls} type="email" placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          {isProvider && (
            <Field label="Phone Number *">
              <input className={inputCls} type="tel" placeholder="09XXXXXXXXX" value={phone} maxLength={11} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          )}

          <button type="button" onClick={goNext}
            className="w-full rounded-full bg-teal-700 py-3 font-semibold text-white shadow-md transition hover:bg-teal-800">
            Continue →
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-teal-700 hover:underline" to="/login">Log In</Link>
          </p>
        </div>
      )}

      {/* ── STEP 1: Address + Password + Terms ──────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={isProvider ? goToCredentials : onSubmit} className="space-y-4">

          <Field label="Region *">
            <select className={selectCls} value={region}
              onChange={(e) => { const o = e.target.options[e.target.selectedIndex]; setRegion(e.target.value); setRegionName(o.text); }}>
              <option value="">Select Region</option>
              {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </Field>

          {provinces.length > 0 && (
            <Field label="Province *">
              <select className={selectCls} value={province} disabled={!region || loadingProvinces}
                onChange={(e) => { const o = e.target.options[e.target.selectedIndex]; setProvince(e.target.value); setProvinceName(o.text); }}>
                <option value="">{loadingProvinces ? "Loading..." : "Select Province"}</option>
                {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="City / Municipality *">
            <select className={selectCls} value={city} disabled={!province || loadingCities}
              onChange={(e) => { const o = e.target.options[e.target.selectedIndex]; setCity(e.target.value); setCityName(o.text); }}>
              <option value="">{loadingCities ? "Loading..." : "Select City / Municipality"}</option>
              {cities.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Barangay *">
            <select className={selectCls} value={barangay} disabled={!city || loadingBarangays}
              onChange={(e) => { const o = e.target.options[e.target.selectedIndex]; setBarangay(e.target.value); setBarangayName(o.text); }}>
              <option value="">{loadingBarangays ? "Loading..." : "Select Barangay"}</option>
              {barangays.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </Field>

          <Field label="Street / House No. *">
            <input className={inputCls} placeholder="e.g. 123 Rizal Street" value={street} onChange={(e) => setStreet(e.target.value)} />
          </Field>

          <div className="border-t border-slate-100 pt-2" />

          <Field label="Password *">
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Create a strong password" value={password}
                onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 hover:text-slate-700">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">At least 8 characters with uppercase, lowercase, number, and special character.</p>
          </Field>

          <Field label="Confirm Password *">
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Confirm your password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 hover:text-slate-700">
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <input id="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-500" />
              <label htmlFor="terms" className="text-sm leading-relaxed text-slate-600">
                I have read and agree to the{" "}
                <button type="button" onClick={() => setShowTerms(true)}
                  className="font-semibold text-teal-700 underline hover:text-teal-800">Terms and Conditions</button>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setError(""); setStep(0); }}
              className="flex-1 rounded-full border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-full bg-teal-700 py-3 font-semibold text-white shadow-md transition hover:bg-teal-800 disabled:opacity-60">
              {isProvider ? "Continue →" : loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-teal-700 hover:underline" to="/login">Log In</Link>
          </p>
        </form>
      )}

      {/* ── STEP 2: Credentials — provider only ─────────────────────────────── */}
      {step === 2 && isProvider && (
        <form onSubmit={onSubmit} className="space-y-5">

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <p className="font-semibold">Why we need this</p>
            <p className="mt-0.5">To protect residents, we verify all service providers before approval. Your documents are only seen by our admin team and kept strictly confidential.</p>
          </div>

          {CREDENTIAL_TYPES.map(({ key, label, required, hint }) => (
            <div key={key}>
              <label className="text-sm font-semibold text-slate-700">
                {label}{" "}
                {required
                  ? <span className="text-red-500">*</span>
                  : <span className="font-normal text-slate-400">(optional)</span>}
              </label>
              <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
              <div className="mt-2">
                {previews[key] ? (
                  <div className="relative overflow-hidden rounded-xl border-2 border-teal-400">
                    {previews[key].type === "image" ? (
                      <img src={previews[key].src} alt={label} className="h-36 w-full object-cover" />
                    ) : (
                      <div className="flex items-center gap-3 bg-red-50 px-4 py-4">
                        <span className="text-3xl">📄</span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{previews[key].name}</p>
                          <p className="text-xs text-slate-400">PDF selected</p>
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={() => removeFile(key)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white hover:bg-red-600">
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 transition hover:border-teal-500 hover:bg-teal-50">
                    <span className="text-2xl">📎</span>
                    <span className="mt-1 text-sm font-medium text-slate-600">
                      Click to upload {required ? "(required)" : "(optional)"}
                    </span>
                    <span className="text-xs text-slate-400">JPEG, PNG, WEBP or PDF · Max 5 MB</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden" onChange={(e) => handleFileChange(key, e)} />
                  </label>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setError(""); setStep(1); }}
              className="flex-1 rounded-full border border-slate-200 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-full bg-teal-700 py-3 font-semibold text-white shadow-md transition hover:bg-teal-800 disabled:opacity-60">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-teal-700 hover:underline" to="/login">Log In</Link>
          </p>
        </form>
      )}

      {/* ── Terms Modal ──────────────────────────────────────────────────────── */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Terms and Conditions</h2>
              <button onClick={() => setShowTerms(false)}
                className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">Close</button>
            </div>
            <div className="overflow-y-auto px-6 py-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">{TERMS}</pre>
            </div>
            <div className="border-t border-slate-100 px-6 py-4">
              <button onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                className="w-full rounded-full bg-teal-700 py-3 font-semibold text-white hover:bg-teal-800">
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthSplitLayout>
  );
}
