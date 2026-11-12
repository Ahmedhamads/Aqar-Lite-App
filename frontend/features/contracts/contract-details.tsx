
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

import { isApiError } from "@/lib/api/errors";
import { contractService } from "@/services/contract.service";
import { useLanguage } from "@/features/language/language-provider";
import { CreatePaymentDialog } from "@/features/payments/create-payment-dialog";
import type {
  Contract,
  ContractInstallment,
  InstallmentStatus,
} from "@/types/contract.types";

interface ContractDetailsProps {
  contractId: string;
}

export function ContractDetails({
  contractId,
}: ContractDetailsProps) {
  const { language, direction, t } = useLanguage();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
const [showCreatePaymentDialog, setShowCreatePaymentDialog] =
  useState(false);

  useEffect(() => {
    let active = true;

    async function loadContract() {
      setLoading(true);
      setError("");

      try {
        const response = await contractService.getById(contractId);

        if (active) {
          setContract(response);
        }
      } catch (err) {
        if (!active) return;

        setContract(null);
        setError(
          isApiError(err)
            ? err.message
            : t("contractDetailsLoadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadContract();

    return () => {
      active = false;
    };
  }, [contractId, t, retryKey]);
  async function handleApproveContract() {
  if (!contract || contract.status !== "DRAFT") {
    return;
  }

  const confirmed = window.confirm(
    t("confirmApproveContract"),
  );

  if (!confirmed) {
    return;
  }

  setApproving(true);
  setApprovalError("");

  try {
    await contractService.approve(contract.id);

    const updatedContract =
      await contractService.getById(contract.id);

    setContract(updatedContract);
  } catch (err) {
    setApprovalError(
      isApiError(err)
        ? err.message
        : t("contractApproveError"),
    );
  } finally {
    setApproving(false);
  }
}

  function formatMoney(value: string | number) {
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
        month: "short",
        day: "numeric",
      },
    ).format(new Date(value));
  }

  function getInstallmentStatusLabel(status: InstallmentStatus) {
    switch (status) {
      case "PAID":
        return t("installmentPaid");

      case "PARTIAL":
      case "PARTIALLY_PAID":
        return t("installmentPartial");

      case "PENDING":
      default:
        return t("installmentPending");
    }
  }

  function getInstallmentStatusClass(status: InstallmentStatus) {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700";

      case "PARTIAL":
      case "PARTIALLY_PAID":
        return "bg-amber-50 text-amber-700";

      case "PENDING":
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function calculatePaid(installments: ContractInstallment[]) {
    return installments.reduce(
      (total, installment) =>
        total + Number(installment.paidAmount),
      0,
    );
  }

  function calculateRemaining(installments: ContractInstallment[]) {
    return installments.reduce(
      (total, installment) =>
        total +
        Math.max(
          0,
          Number(installment.amount) -
            Number(installment.paidAmount),
        ),
      0,
    );
  }

  if (loading) {
    return (
      <main
        className="flex min-h-80 items-center justify-center p-6"
        dir={direction}
      >
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
      </main>
    );
  }

  if (error || !contract) {
    return (
      <main className="space-y-5 p-4 sm:p-6" dir={direction}>
        <Link
          href="/dashboard/contracts"
          className="inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          ← {t("backToContracts")}
        </Link>

        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error || t("contractNotFound")}
        </div>
      </main>
    );
  }

  const installments = contract.installments ?? [];
  const totalPaid = calculatePaid(installments);
  const totalRemaining = calculateRemaining(installments);

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/contracts"
            className="mb-3 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            ← {t("backToContracts")}
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">
            {t("contractDetails")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("contractDetailsDescription")}
          </p>
        </div>

       <div className="flex flex-wrap items-center gap-3">
        {user?.role === "ACCOUNTANT" &&
  contract.status === "APPROVED" &&
  totalRemaining > 0 && (
    <button
      type="button"
      onClick={() => setShowCreatePaymentDialog(true)}
      className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
    >
      + {t("recordPayment")}
    </button>
  )}
  {contract.status === "APPROVED" && (
    <Link
      href={`/dashboard/contracts/${contract.id}/installments`}
      className="rounded-lg border border-teal-700 px-5 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
    >
      {t("viewInstallments")}
    </Link>
  )}

  {user?.role === "ACCOUNTANT" &&
    contract.status === "DRAFT" && (
      <button
        type="button"
        onClick={handleApproveContract}
        disabled={approving}
        className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {approving
          ? t("approvingContract")
          : t("approveContract")}
      </button>
    )}

  <span
    className={`rounded-full px-4 py-2 text-sm font-semibold ${
      contract.status === "APPROVED"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-amber-50 text-amber-700"
    }`}
  >
    {contract.status === "APPROVED"
      ? t("contractApproved")
      : t("contractDraft")}
  </span>
</div>
      </header>
      {approvalError && (
  <div
    role="alert"
    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
  >
    {approvalError}
  </div>
)}

      {/* Contract Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 font-semibold text-slate-800">
          {t("contractInformation")}
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label={t("contractNumber")}
            value={contract.id.toUpperCase()}
            direction="ltr"
          />

          <InfoItem
            label={t("originalUnitPrice")}
            value={formatMoney(contract.unitPrice)}
          />

          <InfoItem
            label={t("contractFinalPrice")}
            value={formatMoney(contract.finalPrice)}
          />

          <InfoItem
            label={t("contractDownPayment")}
            value={formatMoney(contract.downPayment)}
          />

          <InfoItem
            label={t("contractInstallmentsCount")}
            value={String(contract.installmentsCount)}
          />

          <InfoItem
            label={t("contractStartDate")}
            value={formatDate(contract.startDate)}
          />

          <InfoItem
            label={t("createdAt")}
            value={formatDate(contract.createdAt)}
          />

          <InfoItem
            label={t("contractApprovedAt")}
            value={
              contract.approvedAt
                ? formatDate(contract.approvedAt)
                : "—"
            }
          />
        </div>
      </section>

      {/* Client and Reservation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-800">
            {t("reservationInformation")}
          </h2>

          <div className="space-y-4">
            <InfoItem
              label={t("contractClient")}
              value={contract.reservation.client.name}
            />

            <InfoItem
              label={t("contractPhone")}
              value={contract.reservation.client.phone}
              direction="ltr"
            />

            <InfoItem
              label={t("contractReservationStatus")}
              value={contract.reservation.status}
            />

            <InfoItem
              label={t("createdAt")}
              value={formatDate(contract.reservation.createdAt)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-800">
            {t("unitInformation")}
          </h2>

          <div className="space-y-4">
            <InfoItem
              label={t("contractProject")}
              value={contract.reservation.unit.projectName}
            />

            <InfoItem
              label={t("contractUnitNumber")}
              value={contract.reservation.unit.unitNumber}
            />

            <InfoItem
              label={t("contractUnitType")}
              value={contract.reservation.unit.type}
            />

            <InfoItem
              label={t("contractUnitArea")}
              value={`${contract.reservation.unit.area} m²`}
            />
          </div>
        </section>
      </div>

      {/* Financial Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            {t("totalPaid")}
          </p>

          <p className="mt-2 text-xl font-bold text-emerald-700">
            {formatMoney(totalPaid)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            {t("totalRemaining")}
          </p>

          <p className="mt-2 text-xl font-bold text-amber-700">
            {formatMoney(totalRemaining)}
          </p>
        </div>
      </section>

      {/* Installments */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {t("installmentsSchedule")}
          </h2>
        </div>

        {installments.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            {t("noContractsDescription")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    t("contractInstallmentNumber"),
                    t("contractInstallmentAmount"),
                    t("contractPaidAmount"),
                    t("contractRemainingAmount"),
                    t("contractDueDate"),
                    t("contractInstallmentStatus"),
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
                {installments.map((installment) => {
                  const remaining = Math.max(
                    0,
                    Number(installment.amount) -
                      Number(installment.paidAmount),
                  );

                  return (
                    <tr key={installment.id}>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {installment.sequence}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatMoney(installment.amount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-emerald-700">
                        {formatMoney(installment.paidAmount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {formatMoney(remaining)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(installment.dueDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getInstallmentStatusClass(installment.status)}`}
                        >
                          {getInstallmentStatusLabel(installment.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {showCreatePaymentDialog && (
  <CreatePaymentDialog
    contractId={contract.id}
    remainingAmount={totalRemaining}
    onClose={() => setShowCreatePaymentDialog(false)}
    onCreated={() => {
      setRetryKey((current) => current + 1);
    }}
  />
)}
      </section>
    </main>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
  direction?: "ltr" | "rtl";
}

function InfoItem({
  label,
  value,
  direction,
}: InfoItemProps) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        dir={direction}
        className="mt-1 break-words text-sm font-semibold text-slate-800"
      >
        {value}
      </p>
    </div>
  );
}
