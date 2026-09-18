import { CalendarDays, ClipboardList, Home, LayoutGrid, Search, User, Users, Wallet, Wrench, FileText, ShieldAlert } from "lucide-react";

export const navigationByRole = {
  Resident: [
    { label: "Dashboard", mobileLabel: "Home", to: "/resident", icon: Home },
    { label: "Find Services", mobileLabel: "Services", to: "/resident/find", icon: Search },
    { label: "My Bookings", mobileLabel: "Bookings", to: "/resident/bookings", icon: CalendarDays },
    { label: "Profile", mobileLabel: "Profile", to: "/resident/profile", icon: User },
    { label: "Disputes", mobileLabel: "Issues", to: "/resident/disputes", icon: ShieldAlert, mobile: false },
  ],
  Pro: [
    { label: "Dashboard", mobileLabel: "Home", to: "/pro", icon: Home },
    { label: "Job Requests", mobileLabel: "Requests", to: "/pro/requests", icon: ClipboardList },
    { label: "My Jobs", mobileLabel: "Jobs", to: "/pro/jobs", icon: Wrench },
    { label: "Wallet", mobileLabel: "Wallet", to: "/pro/wallet", icon: Wallet },
    { label: "Profile", mobileLabel: "Profile", to: "/pro/profile", icon: User },
    { label: "Disputes", mobileLabel: "Issues", to: "/pro/disputes", icon: ShieldAlert, mobile: false },
  ],
  Admin: [
    { label: "Dashboard", mobileLabel: "Home", to: "/admin", icon: Home },
    { label: "Users", mobileLabel: "Users", to: "/admin/users", icon: Users },
    { label: "Providers", mobileLabel: "Providers", to: "/admin/providers", icon: LayoutGrid },
    { label: "Bookings", mobileLabel: "Bookings", to: "/admin/bookings", icon: CalendarDays },
    { label: "Reports", mobileLabel: "Reports", to: "/admin/reports", icon: FileText },
    { label: "Disputes", mobileLabel: "Disputes", to: "/admin/disputes", icon: ShieldAlert, mobile: false },
  ],
};

export function isNavigationActive(pathname, to) {
  const isRoot = to === "/resident" || to === "/pro" || to === "/admin";
  return isRoot ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}
