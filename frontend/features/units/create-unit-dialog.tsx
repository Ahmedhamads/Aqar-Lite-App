
"use client";

import { useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { unitService } from "@/services/unit.service";
import { useLanguage } from "@/features/language/language-provider";

import type { CreateUnitInput } from "@/types/unit.types";

interface CreateUnitDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const initialForm: CreateUnitInput = {
  projectName: "",
  unitNumber: "",
  type: "",
  area: "",
  rooms: 0,
  price: "",
};

export function CreateUnitDialog({
  onClose,
  onCreated,
}: CreateUnitDialogProps) {
  const { direction, t } = useLanguage();

  const [form, setForm] = useState<CreateUnitInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof CreateUnitInput>(
    field: K,
    value: CreateUnitInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (
      !form.projectName.trim() ||
      !form.unitNumber.trim() ||
      !form.type.trim() ||
      !form.area ||
      !form.price
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
      form.rooms < 0
    ) {
      setError(t("invalidNumber"));
      return;
    }

    setLoading(true);

    try {
      await unitService.create({
        ...form,
        projectName: form.projectName.trim(),
        unitNumber: form.unitNumber.trim(),
        type: form.type.trim(),
        area: form.area.trim(),
        price: form.price.trim(),
      });

      onCreated();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("unitCreateError"),
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  const labelClass = "mb-2 block text-sm font-medium text-slate-700";

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
        aria-labelledby="create-unit-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 px-6 py-5">
          <h2
            id="create-unit-title"
            className="text-xl font-bold text-slate-900"
          >
            {t("createUnit")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("createUnitDescription")}
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
                value={form.projectName}
                onChange={(event) =>
                  updateField("projectName", event.target.value)
                }
                placeholder={t("projectNamePlaceholder")}
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
                value={form.unitNumber}
                onChange={(event) =>
                  updateField("unitNumber", event.target.value)
                }
                placeholder={t("unitNumberPlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("type")}
              </label>
              <input
                required
                maxLength={80}
                value={form.type}
                onChange={(event) =>
                  updateField("type", event.target.value)
                }
                placeholder={t("typePlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("area")}
              </label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.area}
                onChange={(event) =>
                  updateField("area", event.target.value)
                }
                placeholder={t("areaPlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("rooms")}
              </label>
              <input
                required
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.rooms}
                onChange={(event) =>
                  updateField("rooms", Number(event.target.value))
                }
                placeholder={t("roomsPlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("price")}
              </label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  updateField("price", event.target.value)
                }
                placeholder={t("pricePlaceholder")}
                className={inputClass}
              />
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
              {loading ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
