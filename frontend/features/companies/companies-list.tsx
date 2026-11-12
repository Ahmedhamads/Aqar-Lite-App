
"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

import { companyService } from "@/services/company.service";
import { EditCompanyDialog } from "@/features/companies/edit-company-dialog";

import type { Company } from "@/types/company.types";

export function CompaniesList() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isManager = user?.role === "MANAGER";

  const loadCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const data = await companyService.getCurrent();
      setCompany(data);
    } catch {
      setError(true);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany, retryKey]);

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

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-500">{t("loading")}</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">
          {t("companyLoadError")}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {t("companyLoadErrorDescription")}
        </p>

        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-5 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  const details = [
    {
      label: t("companyName"),
      value: company.name,
    },
    {
      label: t("companyId"),
      value: company.id,
    },
    {
      label: t("companyCreatedAt"),
      value: formatDate(company.createdAt),
    },
    {
      label: t("companyUpdatedAt"),
      value: formatDate(company.updatedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("companiesPageTitle")}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {t("companiesPageDescription")}
          </p>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={() => setShowEditDialog(true)}
            className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            {t("editCompany")}
          </button>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">
            {t("companyInformation")}
          </h2>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="mb-2 text-sm font-medium text-slate-500">
                {item.label}
              </p>

              <p
                className="break-all text-sm font-semibold text-slate-900"
                dir={item.label === t("companyId") ? "ltr" : undefined}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {showEditDialog && isManager && (
        <EditCompanyDialog
          company={company}
          onClose={() => setShowEditDialog(false)}
          onUpdated={(updatedCompany) => {
            setCompany(updatedCompany);
            setShowEditDialog(false);
          }}
        />
      )}
    </div>
  );
}
