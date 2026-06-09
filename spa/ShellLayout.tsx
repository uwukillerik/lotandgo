import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/app-shell";

export function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
