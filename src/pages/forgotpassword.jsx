import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setSuccessMessage(
          data.message || "Check your email, a reset link has been sent."
        );
        setEmail("");
      } else {
        setErrorMessage(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while sending reset instructions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      leftTitle="Recover Your Account"
      leftSubtitle="Reset your password securely and get back to SerbisyoNear."
    >
      <BackToHome />

      <h1 className="text-center text-4xl font-extrabold text-slate-900">
        Forgot Password?
      </h1>
      <p className="mt-2 text-center text-slate-500">
        Enter your email to receive password reset instructions
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
            Email Address
          </label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="juan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>

        <button
          className="w-full rounded-full bg-teal-700 py-3 font-semibold text-white shadow-md transition hover:bg-teal-800 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link className="font-semibold text-teal-700 hover:underline" to="/login">
          Log In
        </Link>
      </p>
    </AuthSplitLayout>
  );
}