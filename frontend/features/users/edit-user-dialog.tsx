
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { isApiError } from "@/lib/api/errors";
import { userService } from "@/services/user.service";
import { useLanguage } from "@/features/language/language-provider";

import type {
  CompanyUser,
  UpdateUserInput,
  UserRole,
} from "@/types/user.types";

interface EditUserDialogProps {
  user: CompanyUser;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditUserDialog({
  user,
  onClose,
  onUpdated,
}: EditUserDialogProps) {
  const { direction, t } = useLanguage();

  const [form, setForm] = useState<UpdateUserInput>({
    name: user.name,
    role: user.role === "MANAGER" ? "SALES" : user.role,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof UpdateUserInput,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = form.name?.trim() ?? "";

    if (!name) {
      setError(t("requiredField"));
      return;
    }

    if (name.length < 2) {
      setError(t("nameMinLength"));
      return;
    }

    if (name.length > 100) {
      setError(t("nameMaxLength"));
      return;
    }

    setLoading(true);

    try {
      const payload: UpdateUserInput = {
        name,
        ...(form.role ? { role: form.role } : {}),
      };

      await userService.update(user.id, payload);

      onUpdated();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("userUpdateError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      dir={direction}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <h2
            id="edit-user-title"
            className="text-xl font-bold text-slate-900"
          >
            {t("editUser")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("editUserDescription")}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="edit-user-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userName")}
            </label>

            <input
              id="edit-user-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={form.name ?? ""}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="edit-user-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userEmail")}
            </label>

            <input
              id="edit-user-email"
              type="email"
              disabled
              value={user.email}
              dir="ltr"
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-slate-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-user-role"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userRole")}
            </label>

            <select
              id="edit-user-role"
              value={form.role ?? "SALES"}
              onChange={(event) =>
                updateField("role", event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            >
              <option value="SALES">{t("sales")}</option>
              <option value="ACCOUNTANT">{t("accountant")}</option>
            </select>
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("saving") : t("save")}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
