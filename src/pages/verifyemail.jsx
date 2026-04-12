import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const hasVerifiedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verifyUserEmail() {
      if (hasVerifiedRef.current) return;
      hasVerifiedRef.current = true;

      const token = searchParams.get("token");

      if (!token) {
        setErrorMessage("Missing verification token.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (data.status === "success") {
          setSuccessMessage(data.message || "Email verified successfully.");
          setErrorMessage("");
        } else {
          setErrorMessage(data.message || "Verification failed.");
          setSuccessMessage("");
        }
      } catch (error) {
        console.error(error);
        setErrorMessage(`Verification request failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    verifyUserEmail();
  }, [searchParams]);

  return (
    <AuthSplitLayout
      leftTitle="Email Verification"
      leftSubtitle="We’re confirming your SerbisyoNear account so you can continue."
    >
      <BackToHome />

      <h1 className="text-center text-4xl font-extrabold text-slate-900">
        Verify Email
      </h1>
      <p className="mt-2 text-center text-slate-500">
        Please wait while we verify your account.
      </p>

      <div className="mt-8">
        {loading && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
            Verifying your email...
          </div>
        )}

        {!loading && successMessage && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/login" className="font-semibold text-teal-700 hover:underline">
          Go to Login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}