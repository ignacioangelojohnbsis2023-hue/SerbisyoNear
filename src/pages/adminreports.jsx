import { useEffect } from "react";

export default function AdminReports() {
  useEffect(() => {
    window.location.replace("/admin/dashboard");
  }, []);
  return null;
}