
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { isApiError } from "@/lib/api/errors";
import { userService } from "@/services/user.service";
import { useLanguage } from "@/features/language/language-provider";

import type { CreateUserInput } from "@/types/user.types";

interface CreateUserDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const initialForm: CreateUserInput = {
  name: "",
  email: "",
  password: "",
  role: "SALES",
};

export function CreateUserDialog({
  onClose,
  onCreated,
}: CreateUserDialogProps) {
  const { direction, t } = useLanguage();

  const [form, setForm] = useState<CreateUserInput>(initialForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof CreateUserInput,
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

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !confirmPassword) {
      setError(t("requiredField"));
      return;
    }

    if (name.length < 2) {
      setError(t("nameMinLength"));
      return;
    }

    if (name.length > 100) {
      setError(t("userCreateError"));
      return;
    }

    if (email.length > 254) {
      setError(t("invalidEmail"));
      return;
    }

    if (form.password.length < 12) {
      setError(t("passwordMinLength"));
      return;
    }

    if (form.password.length > 128) {
      setError(t("passwordMaxLength"));
      return;
    }

    if (form.password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const payload: CreateUserInput = {
        name,
        email,
        password: form.password,
        role: form.role,
      };

      await userService.create(payload);
      onCreated();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("userCreateError"),
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
        aria-labelledby="create-user-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <h2
            id="create-user-title"
            className="text-xl font-bold text-slate-900"
          >
            {t("createUser")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("createUserDescription")}
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
              htmlFor="user-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userName")}
            </label>

            <input
              id="user-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              placeholder={t("userName")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="user-email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userEmail")}
            </label>

            <input
              id="user-email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              dir="ltr"
              value={form.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="user-password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userPassword")}
            </label>

            <input
              id="user-password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              dir="ltr"
              value={form.password}
              onChange={(event) =>
                updateField("password", event.target.value)
              }
              placeholder={t("passwordMinLength")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-user-password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("confirmPassword")}
            </label>

            <input
              id="confirm-user-password"
              type="password"
              required
              maxLength={128}
              autoComplete="new-password"
              dir="ltr"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder={t("confirmPassword")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="user-role"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("userRole")}
            </label>

            <select
              id="user-role"
              value={form.role}
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
              {loading ? t("creatingUser") : t("createUser")}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
