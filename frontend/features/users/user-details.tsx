
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserActivity } from "./user-activity";
import { isApiError } from "@/lib/api/errors";
import { userService } from "@/services/user.service";
import { useLanguage } from "@/features/language/language-provider";

import type { CompanyUser, UserRole } from "@/types/user.types";

interface UserDetailsProps {
  userId: string;
}

export function UserDetails({ userId }: UserDetailsProps) {
  const { language, direction, t } = useLanguage();

  const [user, setUser] = useState<CompanyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const result = await userService.getById(userId);

        if (active) {
          setUser(result);
        }
      } catch (err) {
        if (!active) return;

        setError(
          isApiError(err)
            ? err.message
            : t("userDetailsLoadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [userId, t]);

  function getRoleLabel(role: UserRole) {
    switch (role) {
      case "MANAGER":
        return t("manager");
      case "ACCOUNTANT":
        return t("accountant");
      case "SALES":
        return t("sales");
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(value));
  }

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("userDetails")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("userDetailsDescription")}
          </p>
          <UserActivity userId={userId} />
        </div>

        <Link
          href="/dashboard/users"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {t("backToUsers")}
        </Link>
      </header>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : user ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-xl font-bold text-teal-700">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {user.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500" dir="ltr">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                {t("userName")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {user.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("userEmail")}
              </p>
              <p className="mt-1 font-semibold text-slate-900" dir="ltr">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("userRole")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {getRoleLabel(user.role)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("userStatus")}
              </p>

              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  user.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {user.isActive ? t("active") : t("inactive")}
              </span>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("createdAt")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                {t("updatedAt")}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
