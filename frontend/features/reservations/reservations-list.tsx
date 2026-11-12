
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { isApiError } from "@/lib/api/errors";
import { reservationService } from "@/services/reservation.service";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";
import { CreateReservationDialog } from "@/features/reservations/create-reservation-dialog";

import type {
  Reservation,
  ReservationFilters,
  ReservationStatus,
  ReservationsResponse,
} from "@/types/reservation.types";

const PAGE_SIZE = 10;

export function ReservationsList() {
  const { user } = useAuth();
  const { language, direction, t } = useLanguage();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] =
    useState<ReservationsResponse["pagination"] | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ReservationStatus | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadReservations() {
      setLoading(true);
      setError("");

      try {
        const filters: ReservationFilters = {
          page,
          limit: PAGE_SIZE,
          sortOrder: "desc",
          ...(status ? { status } : {}),
        };

        const response =
          await reservationService.getAll(filters);

        if (!active) return;

        setReservations(response.items);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) return;

        setReservations([]);
        setPagination(null);

        setError(
          isApiError(err)
            ? err.message
            : t("reservationsLoadErrorDescription"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user) {
      void loadReservations();
    }

    return () => {
      active = false;
    };
  }, [user, page, status, retryKey, t]);

  function formatDateTime(value: string) {
    return new Intl.DateTimeFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(value));
  }

  function formatMoney(value: string) {
    return new Intl.NumberFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 2,
      },
    ).format(Number(value));
  }

  function getStatusLabel(reservationStatus: ReservationStatus) {
    switch (reservationStatus) {
      case "ACTIVE":
        return t("active");
      case "EXPIRED":
        return t("expired");
      case "CONVERTED":
        return t("converted");
    }
  }

  function getStatusClass(reservationStatus: ReservationStatus) {
    switch (reservationStatus) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700";
      case "EXPIRED":
        return "bg-slate-100 text-slate-600";
      case "CONVERTED":
        return "bg-blue-50 text-blue-700";
    }
  }

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      {/* Page Header */}
      {/* Page Header */}
<header className="flex flex-wrap items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-slate-900">
      {t("reservationsPageTitle")}
    </h1>

    <p className="mt-1 text-sm text-slate-500">
      {t("reservationsPageDescription")}
    </p>
  </div>

  {user?.role === "SALES" && (
    <button
      type="button"
      onClick={() => setShowCreateDialog(true)}
      className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
    >
      + {t("createReservation")}
    </button>
  )}
</header>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-w-sm">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            {t("allReservationStatuses")}
          </label>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value as ReservationStatus | "",
              );
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
          >
            <option value="">
              {t("allReservationStatuses")}
            </option>

            <option value="ACTIVE">{t("active")}</option>
            <option value="EXPIRED">{t("expired")}</option>
            <option value="CONVERTED">{t("converted")}</option>
          </select>
        </div>
      </section>

      {/* Reservations Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {t("reservationsPageTitle")}
          </h2>

          {pagination && (
            <span className="text-sm text-slate-500">
              {t("showing")} {reservations.length} {t("of")}{" "}
              {pagination.total}
            </span>
          )}
        </div>

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
        ) : reservations.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xl text-slate-500">▤</span>
            </div>

            <h3 className="font-semibold text-slate-800">
              {t("noReservations")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("noReservationsDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    t("reservationNumber"),
                    t("clientName"),
                    t("projectName"),
                    t("unitNumber"),
                    t("reservationSalesRep"),
                    t("price"),
                    t("createdAt"),
                    t("reservationExpiresAt"),
                    t("allReservationStatuses"),
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}

                  <th className="whitespace-nowrap px-5 py-3 font-semibold">
                    {t("viewReservation")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {reservations.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                      <span dir="ltr" className="inline-block">
                        {reservation.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      <div className="font-medium">
                        {reservation.client.name}
                      </div>

                      <div
                        dir="ltr"
                        className="mt-1 text-xs text-slate-500"
                      >
                        {reservation.client.phone}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {reservation.unit.projectName}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {reservation.unit.unitNumber}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {reservation.salesRep?.name ||
                        t("notesNotAvailable")}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                      {formatMoney(reservation.unit.price)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(reservation.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDateTime(reservation.expiresAt)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(reservation.status)}`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/dashboard/reservations/${reservation.id}`}
                        className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                      >
                        {t("viewReservation")}
                      </Link>
                    </td>
                  </tr>
                ))}
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
          {showCreateDialog && (
  <CreateReservationDialog
    onClose={() => setShowCreateDialog(false)}
    onCreated={() => {
      setShowCreateDialog(false);
      setPage(1);
      setRetryKey((current) => current + 1);
    }}
  />
)}
      </section>
    </main>
  );
}
