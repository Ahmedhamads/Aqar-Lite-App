
"use client";

import { useEffect, useState } from "react";

import { CreateClientDialog } from "@/features/clients/create-client-dialog";
import { EditClientDialog } from "@/features/clients/edit-client-dialog";

import { isApiError } from "@/lib/api/errors";
import { clientService } from "@/services/client.service";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

import type {
  Client,
  ClientFilters,
  ClientsResponse,
} from "@/types/client.types";

const PAGE_SIZE = 10;

export function ClientsList() {
  const { user } = useAuth();
  const { language, direction, t } = useLanguage();

  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] =
    useState<ClientsResponse["pagination"] | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingClientId, setDeletingClientId] = useState<string | null>(
    null,
  );

  const [retryKey, setRetryKey] = useState(0);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    let active = true;

    async function loadClients() {
      setLoading(true);
      setError("");

      try {
        const filters: ClientFilters = {
          page,
          limit: PAGE_SIZE,
          sortOrder,
          ...(search.trim() ? { search: search.trim() } : {}),
        };

        const response = await clientService.getAll(filters);

        if (!active) return;

        setClients(response.items);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) return;

        setClients([]);
        setPagination(null);

        setError(
          isApiError(err)
            ? err.message
            : t("clientsLoadErrorDescription"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user?.role === "SALES") {
      void loadClients();
    }

    return () => {
      active = false;
    };
  }, [user?.role, page, search, sortOrder, retryKey, t]);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    ).format(new Date(value));
  }

  async function handleDeleteClient(client: Client) {
    const confirmed = window.confirm(t("confirmDeleteClient"));

    if (!confirmed) return;

    setDeletingClientId(client.id);
    setDeleteError("");

    try {
      await clientService.delete(client.id);

      if (clients.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setRetryKey((current) => current + 1);
      }
    } catch (err) {
      if (
        isApiError(err) &&
        "code" in err &&
        err.code === "CLIENT_HAS_RESERVATIONS"
      ) {
        setDeleteError(t("clientHasReservations"));
      } else if (isApiError(err)) {
        setDeleteError(err.message);
      } else {
        setDeleteError(t("clientDeleteError"));
      }
    } finally {
      setDeletingClientId(null);
    }
  }

  if (user?.role !== "SALES") {
    return (
      <main className="p-6" dir={direction}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {t("forbidden")}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("clientsPageTitle")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("clientsPageDescription")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
        >
          <span className="text-lg">+</span>
          {t("addClient")}
        </button>
      </header>

      {/* Search and Sorting */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              {t("searchClients")}
            </label>

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("searchClientsPlaceholder")}
              maxLength={100}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              {t("sortBy")}
            </label>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as "asc" | "desc");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            >
              <option value="desc">{t("sortNewest")}</option>
              <option value="asc">{t("sortOldest")}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Clients Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {t("clientsPageTitle")}
          </h2>

          {pagination && (
            <span className="text-sm text-slate-500">
              {t("showing")} {clients.length} {t("of")} {pagination.total}
            </span>
          )}
        </div>

        {deleteError && (
          <div
            role="alert"
            className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {deleteError}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              {t("retry")}
            </button>
          </div>
        ) : clients.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xl text-slate-500">♙</span>
            </div>

            <h3 className="font-semibold text-slate-800">
              {t("noClients")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("noClientsDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    t("clientName"),
                    t("clientPhone"),
                    t("clientNotes"),
                    t("createdAt"),
                    `${t("editClient")} / ${t("deleteClient")}`,
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => {
                  const isDeleting = deletingClientId === client.id;

                  return (
                    <tr
                      key={client.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        {client.name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        <span dir="ltr" className="inline-block">
                          {client.phone}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-600">
                        <span className="line-clamp-2">
                          {client.notes || t("notesNotAvailable")}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(client.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={deletingClientId !== null}
                            onClick={() => setEditingClient(client)}
                            className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t("editClient")}
                          </button>

                          <button
                            type="button"
                            disabled={deletingClientId !== null}
                            onClick={() => void handleDeleteClient(client)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? t("deleting") : t("deleteClient")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading &&
          !error &&
          pagination &&
          pagination.totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">
                {t("page")} {pagination.page} {t("of")}{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("previous")}
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}
      </section>

      {/* Create Client Dialog */}
      {showCreateDialog && (
        <CreateClientDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => {
            setShowCreateDialog(false);
            setPage(1);
            setRetryKey((current) => current + 1);
          }}
        />
      )}

      {/* Edit Client Dialog */}
      {editingClient && (
        <EditClientDialog
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onUpdated={() => {
            setEditingClient(null);
            setRetryKey((current) => current + 1);
          }}
        />
      )}
    </main>
  );
}
