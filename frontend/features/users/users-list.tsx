
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CreateUserDialog } from "@/features/users/create-user-dialog";
import { isApiError } from "@/lib/api/errors";
import { userService } from "@/services/user.service";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/features/language/language-provider";
import { EditUserDialog } from "@/features/users/edit-user-dialog";

import type {
  CompanyUser,
  UserFilters,
  UsersResponse,
  UserRole,
} from "@/types/user.types";

const PAGE_SIZE = 10;

export function UsersList() {
  const { user } = useAuth();
  const { language, direction, t } = useLanguage();

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [pagination, setPagination] =
    useState<UsersResponse["pagination"] | null>(null);

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<"" | "ACCOUNTANT" | "SALES">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
const [actionError, setActionError] = useState("");
  const [selectedUser, setSelectedUser] =
  useState<CompanyUser | null>(null);

  async function handleToggleUserStatus(companyUser: CompanyUser) {
  const nextIsActive = !companyUser.isActive;

  const confirmed = window.confirm(
    t(
      nextIsActive
        ? "confirmActivateUser"
        : "confirmDeactivateUser",
    ),
  );

  if (!confirmed) return;

  setUpdatingUserId(companyUser.id);
  setActionError("");

  try {
    await userService.updateStatus(companyUser.id, {
      isActive: nextIsActive,
    });

    setRetryKey((current) => current + 1);
  } catch (err) {
    setActionError(
      isApiError(err)
        ? err.message
        : t("userStatusUpdateError"),
    );
  } finally {
    setUpdatingUserId(null);
  }
}
  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const filters: UserFilters = {
          page,
          limit: PAGE_SIZE,
          sortOrder,
          ...(role ? { role } : {}),
        };

        const response = await userService.getAll(filters);

        if (!active) return;

        setUsers(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) return;

        setUsers([]);
        setPagination(null);

        setError(
          isApiError(err)
            ? err.message
            : t("usersLoadErrorDescription"),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user?.role === "MANAGER") {
      void loadUsers();
    }

    return () => {
      active = false;
    };
  }, [user?.role, page, role, sortOrder, retryKey, t]);

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

  function getRoleLabel(value: UserRole) {
    switch (value) {
      case "MANAGER":
        return t("manager");
      case "ACCOUNTANT":
        return t("accountant");
      case "SALES":
        return t("sales");
    }
  }

  if (user?.role !== "MANAGER") {
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
      <header className="flex flex-wrap items-center justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold text-slate-900">
      {t("usersPageTitle")}
    </h1>

    <p className="mt-1 text-sm text-slate-500">
      {t("usersPageDescription")}
    </p>
  </div>

  <button
    type="button"
    onClick={() => setShowCreateDialog(true)}
    className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
  >
    <span className="text-lg">+</span>
    {t("createUser")}
  </button>
</header>
{actionError && (
  <div
    role="alert"
    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  >
    {actionError}
  </div>
)}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              {t("filterByRole")}
            </label>

            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as "" | "ACCOUNTANT" | "SALES");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            >
              <option value="">{t("allRoles")}</option>
              <option value="ACCOUNTANT">{t("accountant")}</option>
              <option value="SALES">{t("sales")}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              {t("sortBy")}
            </label>

            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as "asc" | "desc");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            >
              <option value="desc">{t("sortNewest")}</option>
              <option value="asc">{t("sortOldest")}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {t("usersPageTitle")}
          </h2>

          {pagination && (
            <span className="text-sm text-slate-500">
              {t("showing")} {users.length} {t("of")} {pagination.total}
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
        ) : users.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <span className="text-xl text-slate-500">♙</span>
            </div>

            <h3 className="font-semibold text-slate-800">
              {t("noUsers")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("noUsersDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[             
  t("userName"),
  t("userEmail"),
  t("userRole"),
  t("userStatus"),
  t("createdAt"),
  t("actions"),

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
                {users.map((companyUser) => (
                  <tr
                    key={companyUser.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                      {companyUser.name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      <span dir="ltr" className="inline-block">
                        {companyUser.email}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {getRoleLabel(companyUser.role)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          companyUser.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {companyUser.isActive
                          ? t("active")
                          : t("inactive")}
                      </span>
                    </td>
<td className="whitespace-nowrap px-5 py-4">
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setSelectedUser(companyUser)}
      className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
    >
      {t("edit")}
    </button>
    <Link
  href={`/dashboard/users/${companyUser.id}`}
  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
>
  {t("view")}
</Link>

    <button
      type="button"
disabled={
  updatingUserId !== null ||
  companyUser.id === user?.id
}      onClick={() => handleToggleUserStatus(companyUser)}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        companyUser.isActive
          ? "border border-red-200 text-red-700 hover:bg-red-50"
          : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      }`}
    >
      {updatingUserId === companyUser.id
        ? t("updatingUser")
        : companyUser.isActive
          ? t("deactivateUser")
          : t("activateUser")}
    </button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("previous")}
                </button>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}
               </section>

      {showCreateDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={() => {
            setShowCreateDialog(false);
            setPage(1);
            setRetryKey((current) => current + 1);
          }}
        />
      )}

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={() => {
            setSelectedUser(null);
            setRetryKey((current) => current + 1);
          }}
        />
      )}
    </main>
  );
}

