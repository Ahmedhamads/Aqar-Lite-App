
"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { direction, t } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  if (!user) {
    return null;
  }

  async function handleLogout() {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/auth/login");
      router.refresh();
    } catch {
      setLogoutError(t("logoutError"));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div
      dir={direction}
      className="flex min-h-screen bg-slate-50"
    >
      <Sidebar
        role={user.role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 p-4 md:p-8">
          {logoutError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {logoutError}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
