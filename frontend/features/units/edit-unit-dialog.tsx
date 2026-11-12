
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { isApiError } from "@/lib/api/errors";
import { unitService } from "@/services/unit.service";
import { useLanguage } from "@/features/language/language-provider";

import type { Unit, UpdateUnitInput } from "@/types/unit.types";

interface EditUnitDialogProps {
  unit: Unit;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditUnitDialog({
  unit,
  onClose,
  onUpdated,
}: EditUnitDialogProps) {
  const { direction, t } = useLanguage();

  const [form, setForm] = useState<UpdateUnitInput>({
    projectName: unit.projectName,
    unitNumber: unit.unitNumber,
    type: unit.type,
    area: unit.area,
    rooms: unit.rooms,
    price: unit.price,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const priceLocked = unit.status !== "AVAILABLE";

  function updateField<K extends keyof UpdateUnitInput>(
    field: K,
    value: UpdateUnitInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !form.projectName?.trim() ||
      !form.unitNumber?.trim() ||
      !form.type?.trim() ||
      !form.area?.trim() ||
      !form.price?.trim()
    ) {
      setError(t("requiredField"));
      return;
    }

    if (
      !Number.isFinite(Number(form.area)) ||
      Number(form.area) <= 0 ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0 ||
      !Number.isInteger(form.rooms) ||
      Number(form.rooms) < 0 ||
      Number(form.rooms) > 100
    ) {
      setError(t("invalidNumber"));
      return;
    }

    setLoading(true);

    try {
      await unitService.update(unit.id, {
        ...form,
        projectName: form.projectName.trim(),
        unitNumber: form.unitNumber.trim(),
        type: form.type.trim(),
        area: form.area.trim(),
        price: form.price.trim(),
      });

      onUpdated();
    } catch (err) {
      setError(
        isApiError(err) ? err.message : t("unitUpdateError"),
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      dir={direction}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-unit-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <h2
            id="edit-unit-title"
            className="text-xl font-bold text-slate-900"
          >
            {t("editUnit")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("editUnitDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                {t("projectName")}
              </label>
              <input
                required
                maxLength={150}
                value={form.projectName ?? ""}
                onChange={(event) =>
                  updateField("projectName", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("unitNumber")}
              </label>
              <input
                required
                maxLength={50}
                value={form.unitNumber ?? ""}
                onChange={(event) =>
                  updateField("unitNumber", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("type")}</label>
              <input
                required
                maxLength={80}
                value={form.type ?? ""}
                onChange={(event) =>
                  updateField("type", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("area")}</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.area ?? ""}
                onChange={(event) =>
                  updateField("area", event.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("rooms")}</label>
              <input
                required
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.rooms ?? 0}
                onChange={(event) =>
                  updateField("rooms", Number(event.target.value))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("price")}</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                disabled={priceLocked}
                value={form.price ?? ""}
                onChange={(event) =>
                  updateField("price", event.target.value)
                }
                className={inputClass}
              />

              {priceLocked && (
                <p className="mt-1 text-xs text-amber-700">
                  {t("priceLocked")}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("saving") : t("updateUnit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
