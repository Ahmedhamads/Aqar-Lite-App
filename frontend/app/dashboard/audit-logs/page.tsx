
"use client";

import { useCallback, useEffect, useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { auditService } from "@/services/audit.service";
import { useLanguage } from "@/features/language/language-provider";
import { formatAuditAction } from "@/features/audit-logs/audit-log.utils";
import type {
  AuditLog,
  AuditLogsResponse,
} from "@/types/audit-log.types";

const PAGE_SIZE = 10;

export default function AuditLogsPage() {
  const { t } = useLanguage();

  const [result, setResult] = useState<AuditLogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [actorId, setActorId] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await auditService.getAll({
        page,
        limit: PAGE_SIZE,
        ...(actorFilter.trim()
          ? { actorId: actorFilter.trim() }
          : {}),
      });

      setResult(response);
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("auditLogsLoadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [page, actorFilter, t]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setActorFilter(actorId);
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function formatMetadata(metadata: unknown) {
    if (!metadata) return "—";

    if (typeof metadata === "string") return metadata;

    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return "—";
    }
  }

  function renderLog(log: AuditLog) {
    return (
      <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
        <td className="px-4 py-4">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {log.actor?.name ?? t("unknownUser")}
          </p>
          {log.actor?.email && (
            <p className="mt-1 text-xs text-gray-500">
              {log.actor.email}
            </p>
          )}
        </td>

        <td className="px-4 py-4">
          <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
           {formatAuditAction(log.action, t)}
          </span>
        </td>

        <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
          {log.entityType}
        </td>

        <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
          {log.entityId ?? "—"}
        </td>

        <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
          {formatDate(log.createdAt)}
        </td>

        <td className="px-4 py-4">
          <details className="max-w-xs">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
              {t("viewDetails")}
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {formatMetadata(log.metadata)}
            </pre>
          </details>
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t("auditLogs")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("auditLogsDescription")}
        </p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:flex-row"
      >
        <input
          type="text"
          value={actorId}
          onChange={(event) => setActorId(event.target.value)}
          placeholder={t("filterByActorId")}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-700"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t("applyFilter")}
        </button>

        <button
          type="button"
          disabled={loading && !actorFilter}
          onClick={() => {
            setActorId("");
            setActorFilter("");
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
        >
          {t("clearFilter")}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t("auditLogs")}
          </h2>

          <button
            type="button"
            onClick={() => void loadAuditLogs()}
            disabled={loading}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {t("refresh")}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {t("loading")}
          </div>
        ) : result?.items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("user")}</th>
                    <th className="px-4 py-3 font-medium">{t("action")}</th>
                    <th className="px-4 py-3 font-medium">{t("entityType")}</th>
                    <th className="px-4 py-3 font-medium">{t("entityId")}</th>
                    <th className="px-4 py-3 font-medium">{t("date")}</th>
                    <th className="px-4 py-3 font-medium">{t("details")}</th>
                  </tr>
                </thead>

                <tbody>{result.items.map(renderLog)}</tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {t("page")} {result.pagination.page} {t("of")}{" "}
                {result.pagination.totalPages} · {result.pagination.total}{" "}
                {t("records")}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!result.pagination.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
                >
                  {t("previous")}
                </button>

                <button
                  type="button"
                  disabled={!result.pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-sm text-gray-500">
            {t("noAuditLogs")}
          </div>
        )}
      </div>
    </div>
  );
}
