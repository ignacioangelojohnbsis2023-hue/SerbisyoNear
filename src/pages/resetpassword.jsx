import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const passwordBytes = new TextEncoder().encode(newPassword).length;
    if (passwordBytes > 72) {
      setErrorMessage("Password is too long. Please use 72 bytes or fewer.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setSuccessMessage(data.message || "Password reset successfully.");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setErrorMessage(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while resetting your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      leftTitle="Set a New Password"
      leftSubtitle="Choose a secure new password for your SerbisyoNear account."
    >
      <BackToHome />

      <h1 className="text-center text-4xl font-extrabold text-slate-900">
        Reset Password
      </h1>
      <p className="mt-2 text-center text-slate-500">
        Enter your new password below
      </p>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
            <label className="text-sm font-semibold text-slate-700">
                New Password
            </label>
            <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                required
                minLength={8}
                maxLength={72}
            />
            <p className="mt-2 text-xs text-slate-500">
                Must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">
            Confirm New Password
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            required
          />
        </div>

        <button
          className="w-full rounded-full bg-teal-700 py-3 font-semibold text-white shadow-md transition hover:bg-teal-800 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Back to{" "}
        <Link className="font-semibold text-teal-700 hover:underline" to="/login">
          Log In
        </Link>
      </p>
    </AuthSplitLayout>
  );
}