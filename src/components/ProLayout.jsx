import React from "react";
import AppShell from "./AppShell";

export default function ProLayout(props) {
  return <AppShell {...props} role="Pro" headerEyebrow={props.headerEyebrow || "Provider"} />;
}
