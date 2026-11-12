
"use client";

import { useLanguage } from "@/features/language/language-provider";

export function LoadingScreen({
  message,
}: {
  message?: string;
}) {
  const { direction, t } = useLanguage();

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-slate-50"
      dir={direction}
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />

        <p className="text-sm font-medium text-slate-600">
          {message ?? t("loading")}
        </p>
      </div>
    </main>
  );
}
