
"use client";

import type { AuthUser, UserRole } from "@/types/auth.types";
import { useLanguage } from "@/features/language/language-provider";
import type { TranslationKey } from "@/features/language/translations";

interface TopbarProps {
  user: AuthUser;
  onMenuClick: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const roleTranslationKeys: Record<UserRole, TranslationKey> = {
  MANAGER: "roleManager",
  ACCOUNTANT: "roleAccountant",
  SALES: "roleSales",
};

export function Topbar({
  user,
  onMenuClick,
  onLogout,
  isLoggingOut,
}: TopbarProps) {
  const { language, toggleLanguage, t } = useLanguage();

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t("openMenu")}
          className="rounded-lg border border-slate-200 p-2 text-xl text-slate-600 hover:bg-slate-50 lg:hidden"
        >
          ☰
        </button>

        <div className="min-w-0">
          <p className="text-xs text-slate-400">
            {t("appDescription")}
          </p>

          <h2 className="truncate text-sm font-bold text-slate-900 md:text-base">
            
            {t("welcome")}
{language === "ar" ? "، " : ", "}
{user.name}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
       

        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {user.name}
          </p>

          <p className="text-xs text-slate-500">
            {t(roleTranslationKeys[user.role])}
          </p>
        </div>

        <div
          title={user.name}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800"
        >
          {initials || (language === "ar" ? "ع" : "A")}
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 md:text-sm"
        >
          {isLoggingOut ? t("loggingOut") : t("logout")}
        </button>
         <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t("switchLanguage")}
          title={t("switchLanguage")}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 md:text-sm"
        >
          <span aria-hidden="true">🌐</span>
          <span>{t("switchLanguage")}</span>
        </button>
      </div>
    </header>
  );
}
