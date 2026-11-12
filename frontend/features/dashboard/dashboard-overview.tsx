
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/features/language/language-provider";
import { isApiError } from "@/lib/api/errors";
import { dashboardService } from "@/services/dashboard.service";
import { formatAuditAction } from "@/features/audit-logs/audit-log.utils";
import type {
  DashboardSummary,
  DashboardActivity,
} from "@/types/dashboard.types";
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  accent: "blue" | "green" | "orange" | "purple";
  formatNumber: (value: number) => string;
  statisticsLabel: string;
}

function StatCard({
  title,
  value,
  description,
  accent,
  formatNumber,
  statisticsLabel,
}: StatCardProps) {
  const accentClasses = {
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    green: "border-green-500 bg-green-50 text-green-700",
    orange: "border-orange-500 bg-orange-50 text-orange-700",
    purple: "border-purple-500 bg-purple-50 text-purple-700",
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {formatNumber(value)}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div
          className={`rounded-lg border-r-4 px-3 py-2 text-xs font-semibold ${accentClasses[accent]}`}
        >
          {statisticsLabel}
        </div>
      </div>
    </article>
  );
}

interface BreakdownItemProps {
  label: string;
  value: number;
  color: string;
  formatNumber: (value: number) => string;
}

function BreakdownItem({
  label,
  value,
  color,
  formatNumber,
}: BreakdownItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>

      <span className="font-semibold text-gray-900">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-72 animate-pulse rounded-xl bg-gray-100" />
      </div>
      
    </div>
  );
}

export default function DashboardOverview() {
  const { language, direction, t } = useLanguage();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const recentActivity = summary?.recentActivity ?? [];

  const numberFormatter = new Intl.NumberFormat(
    language === "ar" ? "ar-EG" : "en-US",
  );

  const currencyFormatter = new Intl.NumberFormat(
    language === "ar" ? "ar-EG" : "en-US",
    {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 2,
    },
  );

  function formatNumber(value: number): string {
    return numberFormatter.format(value);
  }

  function formatCurrency(value: number): string {
    return currencyFormatter.format(value);
  }
  function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat(
    language === "ar" ? "ar-EG" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const result = await dashboardService.getSummary();

        if (!cancelled) {
          setSummary(result);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = isApiError(err)
            ? err.message
            : t("dashboardLoadErrorDescription");

          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [retryKey, t]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error || !summary) {
    return (
      <section
        dir={direction}
        className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm"
      >
        <h2 className="text-lg font-bold text-gray-900">
          {t("dashboardLoadError")}
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error ?? t("noServerData")}
        </p>

        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("retry")}
        </button>
        
      </section>
    );
  }

  const statCards: StatCardProps[] = [
    {
      title: t("totalUnits"),
      value: summary.units.total,
      description: `${formatNumber(summary.units.available)} ${t("availableUnits")}`,
      accent: "blue",
      formatNumber,
      statisticsLabel: t("statistics"),
    },
    {
      title: t("totalClients"),
      value: summary.clients.total,
      description: t("registeredClients"),
      accent: "green",
      formatNumber,
      statisticsLabel: t("statistics"),
    },
    {
      title: t("totalReservations"),
      value: summary.reservations.total,
      description: `${formatNumber(summary.reservations.active)} ${t("activeReservations")}`,
      accent: "orange",
      formatNumber,
      statisticsLabel: t("statistics"),
    },
    {
      title: t("totalContracts"),
      value: summary.contracts.total,
      description: `${formatNumber(summary.contracts.approved)} ${t("approvedContracts")}`,
      accent: "purple",
      formatNumber,
      statisticsLabel: t("statistics"),
    },
  ];

  return (
    <div dir={direction} className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard")}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {t("dashboardDescription")}
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {t("mainStatistics")}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t("unitStatus")}
          </h2>

          <BreakdownItem
            label={t("available")}
            value={summary.units.available}
            color="bg-green-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("reserved")}
            value={summary.units.reserved}
            color="bg-orange-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("sold")}
            value={summary.units.sold}
            color="bg-blue-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("total")}
            value={summary.units.total}
            color="bg-gray-500"
            formatNumber={formatNumber}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t("reservationStatus")}
          </h2>

          <BreakdownItem
            label={t("active")}
            value={summary.reservations.active}
            color="bg-green-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("expired")}
            value={summary.reservations.expired}
            color="bg-red-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("converted")}
            value={summary.reservations.converted}
            color="bg-blue-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("total")}
            value={summary.reservations.total}
            color="bg-gray-500"
            formatNumber={formatNumber}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t("contractStatus")}
          </h2>

          <BreakdownItem
            label={t("drafts")}
            value={summary.contracts.draft}
            color="bg-orange-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("approved")}
            value={summary.contracts.approved}
            color="bg-green-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("total")}
            value={summary.contracts.total}
            color="bg-gray-500"
            formatNumber={formatNumber}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-gray-900">
            {t("installmentsTitle")}
          </h2>

          <BreakdownItem
            label={t("totalInstallments")}
            value={summary.installments.total}
            color="bg-blue-500"
            formatNumber={formatNumber}
          />

          <BreakdownItem
            label={t("overdueInstallments")}
            value={summary.installments.overdue}
            color="bg-red-500"
            formatNumber={formatNumber}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {t("financialSummary")}
        </h2>
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-900">
        {t("recentActivity")}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {t("recentActivityDescription")}
      </p>
    </div>

    <Link
      href="/dashboard/audit-logs"
      className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
    >
      {t("viewAllLogs")}
    </Link>
  </div>

  {recentActivity.length === 0 ? (
    <p className="py-8 text-center text-sm text-gray-500">
      {t("noRecentActivity")}
    </p>
  ) : (
    <div>
      {recentActivity.map((activity) => (
        <ActivityItem
          key={activity.id}
          activity={activity}
          formatDate={formatActivityDate}
          t={t}
        />
      ))}
    </div>
  )}
</section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              {t("installmentAmount")}
            </p>

            <p className="mt-3 text-xl font-bold text-gray-900">
              {formatCurrency(summary.financials.installmentAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm text-green-700">
              {t("collectedAmount")}
            </p>

            <p className="mt-3 text-xl font-bold text-green-800">
              {formatCurrency(summary.financials.collectedAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <p className="text-sm text-orange-700">
              {t("remainingAmount")}
            </p>

            <p className="mt-3 text-xl font-bold text-orange-800">
              {formatCurrency(summary.financials.remainingAmount)}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {t("financialNote")}
        </p>
      </section>
    </div>
  );
}
function ActivityItem({
  activity,
  formatDate,
  t,
}: {
  activity: DashboardActivity;
  formatDate: (value: string) => string;
 t: (
  key:
    | "unknownUser"
    | "entityId"
    | "actionPaymentCreated"
    | "actionContractApproved"
    | "actionContractCreated"
    | "actionReservationConverted"
    | "actionReservationCreated"
    | "actionUserCreated"
    | "actionUserUpdated"
    | "actionUserActivated"
    | "actionUserDeactivated"
    | "actionLoginSuccess"
    | "actionLogout"
) => string;
}) {
  return (
    <article className="flex flex-col gap-2 border-b border-gray-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">
          {formatAuditAction(activity.action, t)}
        </p>

        <p className="mt-1 text-sm text-gray-600">
          {activity.actor?.name ?? t("unknownUser")}
          {" · "}
          {activity.entityType}
        </p>

        {activity.entityId && (
          <p className="mt-1 break-all text-xs text-gray-400">
            {t("entityId")}: {activity.entityId}
          </p>
        )}
      </div>

      <time
        className="shrink-0 text-xs text-gray-500"
        dateTime={activity.createdAt}
      >
        {formatDate(activity.createdAt)}
      </time>
    </article>
  );
}
