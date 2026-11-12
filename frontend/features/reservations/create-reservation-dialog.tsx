"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { isApiError } from "@/lib/api/errors";
import { unitService } from "@/services/unit.service";
import { clientService } from "@/services/client.service";
import { reservationService } from "@/services/reservation.service";
import { useLanguage } from "@/features/language/language-provider";

import type { Unit } from "@/types/unit.types";
import type { Client } from "@/types/client.types";

interface CreateReservationDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateReservationDialog({
  onClose,
  onCreated,
}: CreateReservationDialogProps) {
  const { direction, t } = useLanguage();

  const [units, setUnits] = useState<Unit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [unitId, setUnitId] = useState("");
  const [clientId, setClientId] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const [unitsResponse, clientsResponse] =
          await Promise.all([
            unitService.getAll({
              page: 1,
              limit: 100,
              status: "AVAILABLE",
              sortOrder: "asc",
            }),
            clientService.getAll({
              page: 1,
              limit: 100,
              sortOrder: "desc",
            }),
          ]);

        if (!active) return;

        setUnits(unitsResponse.items);
        setClients(clientsResponse.items);
      } catch (err) {
        if (!active) return;

        setError(
          isApiError(err)
            ? err.message
            : t("reservationOptionsLoadError"),
        );
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      active = false;
    };
  }, [t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>){
    event.preventDefault();

    if (!unitId || !clientId) {
      setError(t("reservationRequiredFields"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await reservationService.create({
        unitId,
        clientId,
      });

      onCreated();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("reservationCreateError"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatMoney(value: string) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      dir={direction}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {t("createReservation")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
aria-label={t("cancel")}            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {loadingOptions ? (
            <div className="flex min-h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="reservation-unit"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {t("selectUnit")}
                </label>

                <select
                  id="reservation-unit"
                  required
                  value={unitId}
                  onChange={(event) => setUnitId(event.target.value)}
                  disabled={submitting || units.length === 0}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 disabled:bg-slate-100"
                >
                  <option value="">
                    {t("selectUnitPlaceholder")}
                  </option>

                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.projectName} - {unit.unitNumber}
                      {" | "}
                      {formatMoney(unit.price)}
                    </option>
                  ))}
                </select>

                {units.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    {t("noAvailableUnits")}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reservation-client"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {t("selectClient")}
                </label>

                <select
                  id="reservation-client"
                  required
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  disabled={submitting || clients.length === 0}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 disabled:bg-slate-100"
                >
                  <option value="">
                    {t("selectClientPlaceholder")}
                  </option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.phone}
                    </option>
                  ))}
                </select>

                {clients.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    {t("noClientsAvailable")}
                  </p>
                )}
              </div>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
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
                loadingOptions ||
                submitting ||
                units.length === 0 ||
                clients.length === 0
              }
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? t("creatingReservation")
                : t("createReservation")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}