
"use client";

import { useEffect, useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { auditService } from "@/services/audit.service";
import { useLanguage } from "@/features/language/language-provider";

import type {
  AuditLog,
  AuditLogPagination,
} from "@/types/audit-log.types";

interface UserActivityProps {
  userId: string;
}

const PAGE_SIZE = 10;

export function UserActivity({ userId }: UserActivityProps) {
  const { t, language } = useLanguage();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] =
    useState<AuditLogPagination | null>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadActivity() {
      try {
        setLoading(true);
        setError("");

        const response = await auditService.getAll({
          actorId: userId,
          page,
          limit: PAGE_SIZE,
        });

        if (!active) return;

        setLogs(response.items);
        setPagination(response.pagination);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          isApiError(err)
            ? err.message
            : t("userActivityLoadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      active = false;
    };
  }, [userId, page, t]);

  const dateLocale = language === "ar" ? "ar-EG" : "en-US";

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("userActivity")}
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("userActivityDescription")}
        </p>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {t("loading")}
        </p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">
          {error}
        </p>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          {t("noUserActivity")}
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {log.action}
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(log.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t("entityType")}: {log.entityType}
                </p>

                {log.entityId && (
                  <p className="break-all text-xs text-gray-500 dark:text-gray-400">
                    {t("entityId")}: {log.entityId}
                  </p>
                )}

                {log.ipAddress && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    IP: {log.ipAddress}
                  </p>
                )}
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
              >
                {t("previous")}
              </button>

              <span className="text-sm text-gray-500">
                {page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
              >
                {t("next")}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
