import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/landingpage";
import ResidentFind from "./pages/residentfind";
import ResidentBookings from "./pages/residentbookings";
import ResidentProfile from "./pages/residentprofile";
import ProDashboard from "./pages/prodashboard";
import ProRequests from "./pages/prorequests";
import ProJobs from "./pages/projobs";
import ProEarnings from "./pages/proearnings";
import ProProfile from "./pages/proprofile";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotpassword";
import ResidentDashboard from "./pages/residentdashboard";
import AdminDashboard from "./pages/admindashboard";
import AdminUsers from "./pages/adminusers";
import AdminProviders from "./pages/adminproviders";
import AdminBookings from "./pages/adminbookings";
import AdminReports from "./pages/adminreports";
import VerifyEmail from "./pages/verifyemail";
import ResetPassword from "./pages/resetpassword";
import PaymentReturn from "./pages/paymentreturn";

function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function ProtectedRoute({ children, allowedRole }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
  if (user.role === "resident") {
    return <Navigate to="/resident" replace />;
  }
  if (user.role === "pro") {
    return <Navigate to="/pro" replace />;
  }
  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/" replace />;
}

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/payment/success" element={<PaymentReturn />} />
        <Route path="/payment/failed" element={<PaymentReturn />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/providers"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminProviders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resident"
          element={
            <ProtectedRoute allowedRole="resident">
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resident/find"
          element={
            <ProtectedRoute allowedRole="resident">
              <ResidentFind />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resident/bookings"
          element={
            <ProtectedRoute allowedRole="resident">
              <ResidentBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resident/profile"
          element={
            <ProtectedRoute allowedRole="resident">
              <ResidentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pro"
          element={
            <ProtectedRoute allowedRole="pro">
              <ProDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pro/requests"
          element={
            <ProtectedRoute allowedRole="pro">
              <ProRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pro/jobs"
          element={
            <ProtectedRoute allowedRole="pro">
              <ProJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pro/earnings"
          element={
            <ProtectedRoute allowedRole="pro">
              <ProEarnings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pro/profile"
          element={
            <ProtectedRoute allowedRole="pro">
              <ProProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}