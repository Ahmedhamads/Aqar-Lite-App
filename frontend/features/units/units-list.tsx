
"use client";

import { useEffect, useState } from "react";
import { EditUnitDialog } from "@/features/units/edit-unit-dialog";
import { CreateUnitDialog } from "@/features/units/create-unit-dialog";
import { isApiError } from "@/lib/api/errors";
import { unitService } from "@/services/unit.service";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";

import type {
  Unit,
  UnitStatus,
  UnitsResponse,
  UnitFilters
} from "@/types/unit.types";

const PAGE_SIZE = 10;

export function UnitsList() {
  const { user } = useAuth();
  const { language, direction, t } = useLanguage();

  const [units, setUnits] = useState<Unit[]>([]);
  const [pagination, setPagination] =
    useState<UnitsResponse["pagination"] | null>(null);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
const [deleteError, setDeleteError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<UnitStatus | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "area">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const invalidPriceRange =
    minPrice !== "" &&
    maxPrice !== "" &&
    Number(minPrice) > Number(maxPrice);

    async function handleDeleteUnit(unit: Unit) {
  const confirmed = window.confirm(
    t("confirmDeleteUnit"),
  );

  if (!confirmed) return;

  setDeleteError("");
  setDeletingUnitId(unit.id);

  try {
    await unitService.delete(unit.id);

    setRetryKey((current) => current + 1);
  } catch (err) {
    setDeleteError(
      isApiError(err)
        ? err.message
        : t("unitDeleteError"),
    );
  } finally {
    setDeletingUnitId(null);
  }
}

  useEffect(() => {
    let active = true;

    async function loadUnits() {
      if (invalidPriceRange) {
        setUnits([]);
        setPagination(null);
        setLoading(false);
        setError(t("invalidPriceRange"));
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await unitService.getAll({
          page,
          limit: PAGE_SIZE,
          ...(status ? { status } : {}),
          ...(minPrice ? { minPrice } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          sortBy,
          sortOrder,
        });

        if (!active) return;

        setUnits(response.items);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) return;

        setUnits([]);
        setPagination(null);

        setError(
          isApiError(err)
            ? err.message
            : t("unitsLoadErrorDescription"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUnits();

    return () => {
      active = false;
    };
  }, [
    page,
    status,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    invalidPriceRange,
    retryKey,
    t,
  ]);

  function clearFilters() {
    setStatus("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("price");
    setSortOrder("asc");
    setPage(1);
  }

  function formatPrice(value: string) {
    return new Intl.NumberFormat(
      language === "ar" ? "ar-EG" : "en-EG",
      {
        style: "currency",
        currency: "EGP",
        maximumFractionDigits: 2,
      },
    ).format(Number(value));
  }

  function formatArea(value: string) {
    return new Intl.NumberFormat(
      language === "ar" ? "ar-EG" : "en-EG",
      {
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

  function getStatusLabel(unitStatus: UnitStatus) {
    switch (unitStatus) {
      case "AVAILABLE":
        return t("available");
      case "RESERVED":
        return t("reserved");
      case "SOLD":
        return t("sold");
    }
  }

  function getStatusStyle(unitStatus: UnitStatus) {
    switch (unitStatus) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700";
      case "RESERVED":
        return "bg-amber-50 text-amber-700";
      case "SOLD":
        return "bg-slate-100 text-slate-600";
    }
  }

  if (user?.role === "ACCOUNTANT") {
    return (
      <main className="p-6" dir={direction}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {t("forbidden")}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 sm:p-6" dir={direction}>
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("unitsPageTitle")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("unitsPageDescription")}
          </p>
        </div>

        {user?.role === "MANAGER" && (
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            <span className="text-lg">+</span>
            {t("addUnit")}
          </button>
        )}
      </header>

{deleteError && (
  <div
    role="alert"
    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  >
    {deleteError}
  </div>
)}
      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-800">
            {t("filterByStatus")}
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-teal-700 transition hover:text-teal-900"
          >
            {t("clearFilters")}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm text-slate-600">
              {t("status")}
            </label>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as UnitStatus | "");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            >
              <option value="">{t("allStatuses")}</option>
              <option value="AVAILABLE">{t("available")}</option>
              <option value="RESERVED">{t("reserved")}</option>
              <option value="SOLD">{t("sold")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600">
              {t("minPrice")}
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={minPrice}
              onChange={(event) => {
                setMinPrice(event.target.value);
                setPage(1);
              }}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600">
              {t("maxPrice")}
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(event) => {
                setMaxPrice(event.target.value);
                setPage(1);
              }}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600">
              {t("sortBy")}
            </label>

            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as "price" | "area");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            >
              <option value="price">{t("sortByPrice")}</option>
              <option value="area">{t("sortByArea")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600">
              {t("sortBy")}
            </label>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as "asc" | "desc");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600"
            >
              <option value="asc">{t("ascending")}</option>
              <option value="desc">{t("descending")}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Units Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {t("unitsPageTitle")}
          </h2>

          {pagination && (
            <span className="text-sm text-slate-500">
              {t("showing")} {units.length} {t("of")} {pagination.total}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              {t("retry")}
            </button>
          </div>
        ) : units.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xl text-slate-500">⌂</span>
            </div>

            <h3 className="font-semibold text-slate-800">
              {t("noUnits")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("noUnitsDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    t("projectName"),
                    t("unitNumber"),
                    t("type"),
                    t("area"),
                    t("rooms"),
                    t("price"),
                    t("status"),
                    t("createdAt"),
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
                {units.map((unit) => (
                  <tr
                    key={unit.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                      {unit.projectName}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {unit.unitNumber}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {unit.type}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {formatArea(unit.area)} m²
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {unit.rooms}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {formatPrice(unit.price)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(unit.status)}`}
                      >
                        {getStatusLabel(unit.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(unit.createdAt)}
                    </td>
 
<td className="whitespace-nowrap px-4 py-4 text-sm">
  {user?.role === "MANAGER" && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditingUnit(unit)}
        className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
      >
        {t("editUnit")}
      </button>

      <button
        type="button"
        disabled={deletingUnitId === unit.id}
        onClick={() => handleDeleteUnit(unit)}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deletingUnitId === unit.id
          ? t("deleting")
          : t("deleteUnit")}
      </button>
    </div>
  )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading &&
          !error &&
          pagination &&
          pagination.totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">
                {t("page")} {pagination.page} {t("of")}{" "}
                {pagination.totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("previous")}
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}
      </section>

      {/* Create Unit Dialog */}
      {showCreateDialog && user?.role === "MANAGER" && (
        <CreateUnitDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => {
            setShowCreateDialog(false);
            setPage(1);
            setRetryKey((current) => current + 1);
          }}
        />
      )}
      {editingUnit && user?.role === "MANAGER" && (
  <EditUnitDialog
    unit={editingUnit}
    onClose={() => setEditingUnit(null)}
    onUpdated={() => {
      setEditingUnit(null);
      setRetryKey((current) => current + 1);
    }}
  />
)}
    </main>
  );
}
