
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/features/language/language-provider";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/hooks/use-auth";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { direction, t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.status === 401) {
          setError(t("invalidCredentials"));
        } else if (err.status === 429) {
          setError(t("tooManyLoginAttempts"));
        } else {
          setError(err.message);
        }
      } else {
        setError(t("serverUnavailable"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      dir={direction}
      className="space-y-5"
    >
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
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          {t("email")}
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          dir="ltr"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          {t("password")}
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("passwordPlaceholder")}
            className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${
              direction === "rtl" ? "pl-20" : "pr-20"
            }`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className={`absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-teal-700 ${
              direction === "rtl" ? "left-3" : "right-3"
            }`}
          >
            {showPassword ? t("hidePassword") : t("showPassword")}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? t("loggingIn") : t("loginButton")}
      </button>
    </form>
  );
}
