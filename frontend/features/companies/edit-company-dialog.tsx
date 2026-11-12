
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { companyService } from "@/services/company.service";
import { useLanguage } from "@/features/language/language-provider";

import type { Company } from "@/types/company.types";

interface EditCompanyDialogProps {
  company: Company;
  onClose: () => void;
  onUpdated: (company: Company) => void;
}

export function EditCompanyDialog({
  company,
  onClose,
  onUpdated,
}: EditCompanyDialogProps) {
  const { t } = useLanguage();

  const [name, setName] = useState(company.name);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(t("nameMinLength"));
      return;
    }

    if (trimmedName.length > 150) {
      setError(t("nameMaxLength"));
      return;
    }

    try {
      setLoading(true);

      const updatedCompany = await companyService.updateCurrent({
        name: trimmedName,
      });

      onUpdated(updatedCompany);
    } catch {
      setError(t("companyUpdateError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        dir={t("switchLanguage") === "En" ? "rtl" : "ltr"}
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {t("editCompany")}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {t("editCompanyDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="company-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("companyName")}
            </label>

            <input
              id="company-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={150}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("saving") : t("updateCompany")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
