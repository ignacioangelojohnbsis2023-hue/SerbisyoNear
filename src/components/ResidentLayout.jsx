import React from "react";
import AppShell from "./AppShell";

export default function ResidentLayout(props) {
  return <AppShell {...props} role="Resident" headerEyebrow={props.headerEyebrow || "Account"} />;
}
