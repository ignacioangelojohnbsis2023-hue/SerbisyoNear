import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSplitLayout from "../components/AuthSplitLayout";
import BackToHome from "../components/BackToHome";
import { API_BASE_URL } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "resident") {
          navigate("/resident");
        } else if (data.user.role === "pro") {
          navigate("/pro");
        } else if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setErrorMessage(data.message || "Login failed.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout
      leftTitle="Welcome Back"
      leftSubtitle="Continue your journey with SerbisyoNear"
    >
      <BackToHome />

      <h1 className="text-center text-4xl font-extrabold text-slate-900">Log In</h1>
      <p className="mt-2 text-center text-slate-500">Access your SerbisyoNear account</p>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="juan@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700">Password</label>

          <div className="relative mt-2">
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 transition focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 hover:text-slate-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <Link
          className="block text-sm font-semibold text-teal-700 hover:underline"
          to="/forgotpassword"
        >
          Forgot Password?
        </Link>

        <button
          className="w-full rounded-full bg-teal-700 py-3 font-semibold text-white shadow-md transition hover:bg-teal-800 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-teal-700 hover:underline" to="/signup">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}