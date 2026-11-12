
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingScreen } from "@/components/shared/loading-screen";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status } = useAuth();
  const { t, direction } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingScreen message={t("authChecking")} />;
  }

  if (status === "error") {
    return (
      <main
        dir={direction}
        className="flex min-h-screen items-center justify-center bg-slate-50 p-6"
      >
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-3 text-xl font-bold text-slate-900">
            {t("serverConnectionError")}
          </h1>

          <p className="mb-5 text-sm text-slate-600">
            {t("sessionVerificationError")}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {t("retry")}
          </button>
        </div>
      </main>
    );
  }

  if (status !== "authenticated") {
    return <LoadingScreen message={t("redirectingToLogin")} />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
