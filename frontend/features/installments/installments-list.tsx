"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { isApiError } from "@/lib/api/errors";
import { installmentService } from "@/services/installment.service";
import { useLanguage } from "@/features/language/language-provider";

import type {
  Installment,
  InstallmentFilters,
  InstallmentStatus,
  InstallmentsResponse,
} from "@/types/installment.types";

interface InstallmentsListProps {
  contractId: string;
}

const PAGE_SIZE = 10;

export function InstallmentsList({
  contractId,
}: InstallmentsListProps) {
  const { language, direction, t } = useLanguage();

  const [data, setData] =
    useState<InstallmentsResponse | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] =
    useState<InstallmentStatus | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadInstallments() {
      setLoading(true);
      setError("");

      try {
        const filters: InstallmentFilters = {
          page,
          limit: PAGE_SIZE,
          sortOrder: "asc",
          ...(status ? { status } : {}),
        };

        const response =
          await installmentService.getByContract(
            contractId,
            filters,
          );

        if (!active) return;

        setData(response);
      } catch (err) {
        if (!active) return;

        setData(null);

        setError(
          isApiError(err)
            ? err.message
            : t("installmentsLoadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInstallments();

    return () => {
      active = false;
    };
  }, [contractId, page, status, retryKey, t]);

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

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    ).format(new Date(value));
  }

  function getStatusLabel(
    installmentStatus: InstallmentStatus,
  ) {
    switch (installmentStatus) {
      case "PENDING":
        return t("pending");
      case "PARTIALLY_PAID":
        return t("partiallyPaid");
      case "PAID":
        return t("paid");
      case "OVERDUE":
        return t("overdue");
    }
  }

  function getStatusClass(
    installmentStatus: InstallmentStatus,
  ) {
    switch (installmentStatus) {
      case "PENDING":
        return "bg-amber-50 text-amber-700";
      case "PARTIALLY_PAID":
        return "bg-blue-50 text-blue-700";
      case "PAID":
        return "bg-emerald-50 text-emerald-700";
      case "OVERDUE":
        return "bg-red-50 text-red-700";
    }
  }

  function getPaidPercentage(installment: Installment) {
    const amount = Number(installment.amount);

    if (amount <= 0) return 0;

    return Math.min(
      100,
      Math.max(
        0,
        (Number(installment.paidAmount) / amount) * 100,
      ),
    );
  }

  return (
    <main
      className="space-y-6 p-4 sm:p-6"
      dir={direction}
    >
      {/* Header */}
      <header>
        <Link
          href={`/dashboard/contracts/${contractId}`}
          className="mb-3 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          ← {t("backToContract")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">
          {t("installmentsTitle")}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {t("installmentsDescription")}
        </p>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-center"
        >
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setRetryKey((current) => current + 1)
            }
            className="mt-3 text-sm font-semibold text-teal-700"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <>
          {/* Financial Summary */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title={t("installmentsCount")}
              value={String(data.summary.installmentsCount)}
            />

            <SummaryCard
              title={t("totalInstallmentsAmount")}
              value={formatMoney(data.summary.totalAmount)}
            />

            <SummaryCard
              title={t("totalPaidAmount")}
              value={formatMoney(data.summary.paidAmount)}
              valueClass="text-emerald-700"
            />

            <SummaryCard
              title={t("remainingAmount")}
              value={formatMoney(data.summary.remainingAmount)}
              valueClass="text-amber-700"
            />
          </section>

          {/* Contract Financial Information */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-800">
              {t("contractFinancialInformation")}
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <InfoItem
                label={t("contractFinalPrice")}
                value={formatMoney(data.contract.finalPrice)}
              />

              <InfoItem
                label={t("downPayment")}
                value={formatMoney(data.contract.downPayment)}
              />

              <InfoItem
                label={t("remainingAmount")}
                value={formatMoney(data.summary.remainingAmount)}
              />
            </div>
          </section>

          {/* Filter */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="max-w-sm">
              <label
                htmlFor="installment-status"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                {t("filterByInstallmentStatus")}
              </label>

              <select
                id="installment-status"
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value as InstallmentStatus | "",
                  );
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
              >
                <option value="">
                  {t("allInstallmentStatuses")}
                </option>

                <option value="PENDING">
                  {t("pending")}
                </option>

                <option value="PARTIALLY_PAID">
                  {t("partiallyPaid")}
                </option>

                <option value="PAID">
                  {t("paid")}
                </option>

                <option value="OVERDUE">
                  {t("overdue")}
                </option>
              </select>
            </div>
          </section>

          {/* Installments Table */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-800">
                {t("installmentsTitle")}
              </h2>
            </div>

            {data.installments.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <h3 className="font-semibold text-slate-800">
                  {t("noInstallments")}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {t("noInstallmentsDescription")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-start text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {[
                        t("installmentNumber"),
                        t("dueDate"),
                        t("installmentAmount"),
                        t("paidAmount"),
                        t("remainingAmount"),
                        t("paymentProgress"),
                        t("status"),
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
                    {data.installments.map((installment) => (
                      <tr
                        key={installment.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {installment.sequence}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(installment.dueDate)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                          {formatMoney(installment.amount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-emerald-700">
                          {formatMoney(installment.paidAmount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                          {formatMoney(installment.remainingAmount)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex min-w-28 items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-teal-600"
                                style={{
                                  width: `${getPaidPercentage(installment)}%`,
                                }}
                              />
                            </div>

                            <span className="text-xs text-slate-500">
                              {Math.round(
                                getPaidPercentage(installment),
                              )}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(installment.status)}`}
                          >
                            {getStatusLabel(installment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data.pagination.totalPages > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
                <p className="text-sm text-slate-500">
                  {t("page")} {data.pagination.page} {t("of")}{" "}
                  {data.pagination.totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => current - 1)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    {t("previous")}
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >= data.pagination.totalPages
                    }
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40"
                  >
                    {t("next")}
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  valueClass?: string;
}

function SummaryCard({
  title,
  value,
  valueClass = "text-slate-900",
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className={`mt-3 text-xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}