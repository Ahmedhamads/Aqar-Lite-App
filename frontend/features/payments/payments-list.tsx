
"use client";

import { useEffect, useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { paymentService } from "@/services/payment.service";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

import type {
  Payment,
  PaymentFilters,
  PaymentsResponse,
} from "@/types/payment.types";

const PAGE_SIZE = 10;

export function PaymentsList() {
  const { user } = useAuth();
  const { language, direction, t } = useLanguage();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] =
    useState<PaymentsResponse["pagination"] | null>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      setLoading(true);
      setError("");

      try {
        const filters: PaymentFilters = {
          page,
          limit: PAGE_SIZE,
          sortOrder: "desc",
        };

        const response = await paymentService.getAll(filters);

        if (!active) return;

        setPayments(response.items);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) return;

        setPayments([]);
        setPagination(null);

        setError(
          isApiError(err)
            ? err.message
            : t("paymentsLoadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user) {
      void loadPayments();
    }

    return () => {
      active = false;
    };
  }, [user, page, retryKey, t]);

  function formatDate(value: string) {
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

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("paymentsPageTitle")}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {t("paymentsPageDescription")}
        </p>
      </header>

      {/* Payments Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {t("paymentsPageTitle")}
          </h2>

          {pagination && (
            <span className="text-sm text-slate-500">
              {t("showing")} {payments.length} {t("of")}{" "}
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
              onClick={() =>
                setRetryKey((current) => current + 1)
              }
              className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              {t("retry")}
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xl text-slate-500">₤</span>
            </div>

            <h3 className="font-semibold text-slate-800">
              {t("noPayments")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("noPaymentsDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    t("paymentNumber"),
                    t("clientName"),
                    t("projectName"),
                    t("paymentAmount"),
                    t("paymentInstallments"),
                    t("recordedBy"),
                    t("paymentDate"),
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
                {payments.map((payment) => {
                  const firstAllocation = payment.allocations[0];
                  const reservation =
                    firstAllocation?.installment.contract.reservation;

                  const client = reservation?.client;
                  const unit = reservation?.unit;

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        <span dir="ltr" className="inline-block">
                          {payment.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {client?.name ?? "—"}
                        {client?.phone && (
                          <div className="mt-1 text-xs text-slate-500">
                            {client.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <div className="font-medium">
                          {unit?.projectName ?? "—"}
                        </div>

                        {unit && (
                          <div className="mt-1 text-xs text-slate-500">
                            {t("unitNumber")}: {unit.unitNumber}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {formatMoney(payment.amount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {payment.allocations.length}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {payment.recordedBy.name}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(payment.createdAt)}
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
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("previous")}
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}
