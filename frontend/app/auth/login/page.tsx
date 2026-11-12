
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { direction, language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingScreen message={t("authChecking")} />;
  }

  if (status === "authenticated") {
    return (
      <LoadingScreen message={t("redirectingDashboard")} />
    );
  }

  return (
    <main
      dir={direction}
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10"
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex justify-end border-b border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
          >
            <span aria-hidden="true">🌐 </span>
            {t("switchLanguage")}
          </button>
        </div>

        <div className="grid md:grid-cols-2">
          <section className="flex flex-col justify-center bg-teal-800 p-10 text-white md:p-14">
            <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-2xl font-black">
              {language === "ar" ? "ع" : "A"}
            </div>

            <h1 className="mb-5 text-3xl font-bold leading-relaxed">
              {t("loginWelcome")}
            </h1>

            <p className="max-w-md leading-8 text-teal-100">
              {t("loginDescription")}
            </p>

            <div className="mt-12 border-t border-white/20 pt-6 text-sm text-teal-100">
              Aqar Lite Management System
            </div>
          </section>

          <section className="flex flex-col justify-center p-8 md:p-14">
            <div className="mb-8">
              <h2 className="mb-3 text-2xl font-bold text-slate-900">
                {t("loginTitle")}
              </h2>

              <p className="text-sm leading-7 text-slate-500">
                {t("loginSubtitle")}
              </p>
            </div>

            <LoginForm />

            <p className="mt-8 text-center text-xs text-slate-400">
              {t("appName")} © {new Date().getFullYear()}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
