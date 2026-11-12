
"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { isApiError } from "@/lib/api/errors";
import { paymentService } from "@/services/payment.service";
import { useLanguage } from "@/features/language/language-provider";

interface CreatePaymentDialogProps {
  contractId: string;
  remainingAmount: number;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePaymentDialog({
  contractId,
  remainingAmount,
  onClose,
  onCreated,
}: CreatePaymentDialogProps) {
  const { language, direction, t } = useLanguage();

  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const idempotencyRef = useRef<{
    amount: string;
    key: string;
  } | null>(null);

  function formatMoney(value: number) {
    return new Intl.NumberFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 2,
      },
    ).format(value);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedAmount = amount.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
      setError(t("paymentInvalidAmount"));
      return;
    }

    const numericAmount = Number(normalizedAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t("paymentInvalidAmount"));
      return;
    }

    if (numericAmount > remainingAmount + 0.000001) {
      setError(t("paymentExceedsRemaining"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (
        !idempotencyRef.current ||
        idempotencyRef.current.amount !== normalizedAmount
      ) {
        idempotencyRef.current = {
          amount: normalizedAmount,
          key: crypto.randomUUID(),
        };
      }

      await paymentService.create(
        contractId,
        { amount: normalizedAmount },
        idempotencyRef.current.key,
      );

      onCreated();
      onClose();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("paymentCreateError"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      dir={direction}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-payment-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5">
          <h2
            id="create-payment-title"
            className="text-xl font-bold text-slate-900"
          >
            {t("recordPayment")}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {t("paymentRemainingAmount")}:{" "}
            <span className="font-semibold text-slate-800">
              {formatMoney(remainingAmount)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="payment-amount"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("paymentAmount")}
            </label>

            <input
              id="payment-amount"
              type="number"
              min="0.01"
              max={remainingAmount}
              step="0.01"
              required
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                remainingAmount <= 0 ||
                !amount.trim()
              }
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? t("recordingPayment")
                : t("recordPayment")}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
