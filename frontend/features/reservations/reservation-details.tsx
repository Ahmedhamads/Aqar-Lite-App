"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isApiError } from "@/lib/api/errors";
import { reservationService } from "@/services/reservation.service";
import { useLanguage } from "@/features/language/language-provider";

import type { Reservation } from "@/types/reservation.types";

interface ReservationDetailsProps {
  reservationId: string;
}

export function ReservationDetails({
  reservationId,
}: ReservationDetailsProps) {
  const { language, direction, t } = useLanguage();

  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadReservation() {
      setLoading(true);
      setError("");

      try {
        const response =
          await reservationService.getById(reservationId);

        if (active) {
          setReservation(response);
        }
      } catch (err) {
        if (!active) return;

        setReservation(null);

        setError(
          isApiError(err)
            ? err.message
            : t("reservationDetailsLoadError"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReservation();

    return () => {
      active = false;
    };
  }, [reservationId, t]);

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

  function formatDateTime(value: string) {
    return new Intl.DateTimeFormat(
      language === "ar" ? "ar-EG" : "en-GB",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(value));
  }

  function getReservationStatusLabel(status: Reservation["status"]) {
    switch (status) {
      case "ACTIVE":
        return t("active");
      case "EXPIRED":
        return t("expired");
      case "CONVERTED":
        return t("converted");
    }
  }

  function getReservationStatusClass(status: Reservation["status"]) {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700";
      case "EXPIRED":
        return "bg-slate-100 text-slate-600";
      case "CONVERTED":
        return "bg-blue-50 text-blue-700";
    }
  }

  function getUnitStatusLabel(status: Reservation["unit"]["status"]) {
    switch (status) {
      case "AVAILABLE":
        return t("available");
      case "RESERVED":
        return t("reserved");
      case "SOLD":
        return t("sold");
    }
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

  if (error || !reservation) {
    return (
      <main className="space-y-5 p-4 sm:p-6" dir={direction}>
        <Link
          href="/dashboard/reservations"
          className="inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          ← {t("backToReservations")}
        </Link>

        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error || t("reservationNotFound")}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/reservations"
            className="mb-3 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-900"
          >
            ← {t("backToReservations")}
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">
            {t("reservationDetails")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("reservationDetailsDescription")}
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${getReservationStatusClass(reservation.status)}`}
        >
          {getReservationStatusLabel(reservation.status)}
        </span>
      </header>

      {/* Reservation Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 font-semibold text-slate-800">
          {t("reservationInformation")}
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label={t("reservationNumber")}
            value={reservation.id.toUpperCase()}
            direction="ltr"
          />

          <InfoItem
            label={t("createdAt")}
            value={formatDateTime(reservation.createdAt)}
          />

          <InfoItem
            label={t("reservationExpiresAt")}
            value={formatDateTime(reservation.expiresAt)}
          />
        </div>
      </section>

      {/* Client and Sales Representative */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-800">
            {t("clientName")}
          </h2>

          <div className="space-y-4">
            <InfoItem
              label={t("clientName")}
              value={reservation.client.name}
            />

            <InfoItem
              label={t("clientPhone")}
              value={reservation.client.phone}
              direction="ltr"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-semibold text-slate-800">
            {t("reservationSalesRep")}
          </h2>

          <div className="space-y-4">
            <InfoItem
              label={t("reservationSalesRep")}
              value={
                reservation.salesRep?.name ||
                t("notesNotAvailable")
              }
            />

            {reservation.salesRep?.email && (
              <InfoItem
                label={t("email")}
                value={reservation.salesRep.email}
                direction="ltr"
              />
            )}
          </div>
        </section>
      </div>

      {/* Unit Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 font-semibold text-slate-800">
          {t("unitInformation")}
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label={t("projectName")}
            value={reservation.unit.projectName}
          />

          <InfoItem
            label={t("unitNumber")}
            value={reservation.unit.unitNumber}
          />

          <InfoItem
            label={t("type")}
            value={reservation.unit.type}
          />

          <InfoItem
            label={t("area")}
            value={`${reservation.unit.area} m²`}
          />

          <InfoItem
            label={t("price")}
            value={formatMoney(reservation.unit.price)}
          />

          <InfoItem
            label={t("status")}
            value={getUnitStatusLabel(reservation.unit.status)}
          />
        </div>
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