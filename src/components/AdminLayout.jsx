import React from "react";
import AppShell from "./AppShell";

export default function AdminLayout(props) {
  return <AppShell {...props} role="Admin" headerEyebrow={props.headerEyebrow || "Admin"} />;
}
