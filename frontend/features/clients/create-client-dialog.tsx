
"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { isApiError } from "@/lib/api/errors";
import { clientService } from "@/services/client.service";
import { useLanguage } from "@/features/language/language-provider";

import type { CreateClientInput } from "@/types/client.types";

interface CreateClientDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const initialForm: CreateClientInput = {
  name: "",
  phone: "",
  notes: "",
};

export function CreateClientDialog({
  onClose,
  onCreated,
}: CreateClientDialogProps) {
  const { direction, t } = useLanguage();

  const [form, setForm] = useState<CreateClientInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof CreateClientInput,
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
    const phone = form.phone.trim();
    const notes = form.notes?.trim() ?? "";

    if (!name || !phone) {
      setError(t("requiredField"));
      return;
    }

    if (name.length < 2) {
      setError(t("nameMinLength"));
      return;
    }

    if (name.length > 150) {
      setError(t("nameMaxLength"));
      return;
    }

    if (phone.length < 7) {
      setError(t("phoneMinLength"));
      return;
    }

    if (phone.length > 20) {
      setError(t("phoneMaxLength"));
      return;
    }

    if (notes.length > 2000) {
      setError(t("clientCreateError"));
      return;
    }

    setLoading(true);

    try {
      const payload: CreateClientInput = {
        name,
        phone,
        ...(notes ? { notes } : {}),
      };

      await clientService.create(payload);
      onCreated();
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : t("clientCreateError"),
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
        aria-labelledby="create-client-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <h2
            id="create-client-title"
            className="text-xl font-bold text-slate-900"
          >
            {t("createClient")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("createClientDescription")}
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
              htmlFor="client-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("clientName")}
            </label>

            <input
              id="client-name"
              type="text"
              required
              minLength={2}
              maxLength={150}
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              placeholder={t("clientName")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="client-phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("clientPhone")}
            </label>

            <input
              id="client-phone"
              type="tel"
              required
              minLength={7}
              maxLength={20}
              dir="ltr"
              value={form.phone}
              onChange={(event) =>
                updateField("phone", event.target.value)
              }
              placeholder="+20 100 000 0000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none transition focus:border-teal-600"
            />
          </div>

          <div>
            <label
              htmlFor="client-notes"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {t("clientNotes")}
            </label>

            <textarea
              id="client-notes"
              rows={4}
              maxLength={2000}
              value={form.notes ?? ""}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder={t("notesPlaceholder")}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600"
            />
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
