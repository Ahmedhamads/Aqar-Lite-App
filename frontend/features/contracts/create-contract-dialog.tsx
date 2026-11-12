
"use client";

import { useEffect, useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { contractService } from "@/services/contract.service";
import { reservationService } from "@/services/reservation.service";
import { useLanguage } from "@/features/language/language-provider";

import type { CreateContractInput } from "@/types/contract.types";
import type { Reservation } from "@/types/reservation.types";

interface CreateContractDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CreateContractDialog({
  onClose,
  onCreated,
}: CreateContractDialogProps) {
  const { language, direction, t } = useLanguage();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationId, setReservationId] = useState("");

  const [finalPrice, setFinalPrice] = useState("");
  const [downPayment, setDownPayment] = useState("0");
  const [installmentsCount, setInstallmentsCount] = useState("12");
  const [startDate, setStartDate] = useState(getTodayDate());

  const [loadingReservations, setLoadingReservations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === reservationId,
  );

  useEffect(() => {
    let active = true;

    async function loadReservations() {
      setLoadingReservations(true);
      setError("");

      try {
        const response = await reservationService.getAll({
          page: 1,
          limit: 100,
          status: "ACTIVE",
          sortOrder: "desc",
        });

        if (!active) return;

        setReservations(response.items);
      } catch (err) {
        if (!active) return;

        setError(
          isApiError(err)
            ? err.message
            : t("reservationsLoadError"),
        );
      } finally {
        if (active) {
          setLoadingReservations(false);
        }
      }
    }

    void loadReservations();

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!selectedReservation) {
      setFinalPrice("");
      return;
    }

    setFinalPrice(selectedReservation.unit.price);
  }, [selectedReservation]);

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

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!reservationId) {
      setError(t("selectReservation"));
      return;
    }

    const parsedFinalPrice = Number(finalPrice);
    const parsedDownPayment = Number(downPayment);
    const parsedInstallmentsCount = Number(installmentsCount);

    if (
      !Number.isFinite(parsedFinalPrice) ||
      parsedFinalPrice <= 0 ||
      !Number.isFinite(parsedDownPayment) ||
      parsedDownPayment < 0 ||
      parsedDownPayment >= parsedFinalPrice ||
      !Number.isInteger(parsedInstallmentsCount) ||
      parsedInstallmentsCount < 1 ||
      parsedInstallmentsCount > 360 ||
      !startDate
    ) {
      setError(t("contractInvalidInput"));
      return;
    }

    const data: CreateContractInput = {
      reservationId,
      finalPrice: parsedFinalPrice.toFixed(2),
      downPayment: parsedDownPayment.toFixed(2),
      installmentsCount: parsedInstallmentsCount,
      startDate,
    };

    setSaving(true);

    try {
      await contractService.create(data);
      onCreated();
      onClose();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("contractCreateError"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      dir={direction}
    >
      <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t("createContract")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t("createContractDescription")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={t("closeMenu")}
            className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {t("selectReservation")}
            </label>

            {loadingReservations ? (
              <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500">
                {t("loading")}
              </div>
            ) : reservations.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {t("noActiveReservations")}
              </div>
            ) : (
              <select
                value={reservationId}
                onChange={(event) =>
                  setReservationId(event.target.value)
                }
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-teal-600"
              >
                <option value="">
                  {t("selectReservation")}
                </option>

                {reservations.map((reservation) => (
                  <option
                    key={reservation.id}
                    value={reservation.id}
                  >
                    {reservation.client.name} —{" "}
                    {reservation.unit.projectName} /{" "}
                    {reservation.unit.unitNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedReservation && (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">
                  {t("contractClient")}
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedReservation.client.name}
                </p>
                <p
                  dir="ltr"
                  className="mt-1 text-sm text-slate-500"
                >
                  {selectedReservation.client.phone}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  {t("contractUnit")}
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedReservation.unit.projectName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {t("unitNumber")}:{" "}
                  {selectedReservation.unit.unitNumber}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">
                  {t("originalUnitPrice")}
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formatMoney(selectedReservation.unit.price)}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("contractFinalPrice")}
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={finalPrice}
                onChange={(event) =>
                  setFinalPrice(event.target.value)
                }
                required
                disabled={!selectedReservation}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-teal-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("contractDownPayment")}
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={downPayment}
                onChange={(event) =>
                  setDownPayment(event.target.value)
                }
                required
                disabled={!selectedReservation}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-teal-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("contractInstallmentsCount")}
              </label>

              <input
                type="number"
                min="1"
                max="360"
                step="1"
                value={installmentsCount}
                onChange={(event) =>
                  setInstallmentsCount(event.target.value)
                }
                required
                disabled={!selectedReservation}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-teal-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("contractStartDate")}
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
                disabled={!selectedReservation}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-teal-600 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingReservations ||
                reservations.length === 0
              }
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? t("creatingContract")
                : t("createContract")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
