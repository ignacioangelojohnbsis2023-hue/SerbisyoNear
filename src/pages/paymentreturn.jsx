import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | paid | failed
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const booking_id = searchParams.get("booking_id");
    const isFailed = window.location.pathname.includes("failed");
    setBookingId(booking_id);

    if (!booking_id) {
      setStatus("failed");
      return;
    }

    if (isFailed) {
      setStatus("failed");
      return;
    }

    // Verify with backend
    async function verify() {
      try {
        const res = await fetch(`${API_BASE_URL}/payment/verify/${booking_id}`);
        const data = await res.json();
        if (data.status === "success" && data.payment_status === "paid") {
          setStatus("paid");
        } else {
          setStatus("failed");
        }
      } catch (e) {
        setStatus("failed");
      }
    }

    verify();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl text-center">

        {status === "verifying" && (
          <>
            <div className="mb-4 flex justify-center">
              <svg className="h-12 w-12 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Verifying Payment...</h2>
            <p className="mt-2 text-sm text-slate-500">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === "paid" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                <span className="text-3xl">🎉</span>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Payment Successful!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your payment has been confirmed. Thank you for using SerbisyoNear!
            </p>
            {bookingId && (
              <p className="mt-1 text-xs text-slate-400">Booking #{bookingId}</p>
            )}
            <button
              onClick={() => navigate("/resident/bookings")}
              className="mt-6 w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition"
            >
              View My Bookings
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <span className="text-3xl">❌</span>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Payment Failed</h2>
            <p className="mt-2 text-sm text-slate-500">
              Something went wrong with your payment. You can try again from your bookings page.
            </p>
            {bookingId && (
              <p className="mt-1 text-xs text-slate-400">Booking #{bookingId}</p>
            )}
            <button
              onClick={() => navigate("/resident/bookings")}
              className="mt-6 w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition"
            >
              Back to Bookings
            </button>
            <button
              onClick={() => navigate("/resident")}
              className="mt-2 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Go to Dashboard
            </button>
          </>
        )}

      </div>
    </div>
  );
}
