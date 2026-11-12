
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLanguage } from "@/features/language/language-provider";
import type { TranslationKey } from "@/features/language/translations";
import type { UserRole } from "@/types/auth.types";

interface SidebarProps {
  role: UserRole;
  mobileOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  labelKey: TranslationKey;
  href: string;
  icon: string;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    labelKey: "dashboard",
    href: "/dashboard",
    icon: "⌂",
    roles: ["MANAGER", "ACCOUNTANT", "SALES"],
  },
  {
    labelKey: "units",
    href: "/dashboard/units",
    icon: "▦",
    roles: ["MANAGER", "SALES"],
  },
  {
    labelKey: "clients",
    href: "/dashboard/clients",
    icon: "♙",
    roles: ["SALES"],
  },
  {
    labelKey: "reservations",
    href: "/dashboard/reservations",
    icon: "▣",
    roles: ["MANAGER", "SALES"],
  },
  {
    labelKey: "contracts",
    href: "/dashboard/contracts",
    icon: "▤",
    roles: ["MANAGER", "ACCOUNTANT", "SALES"],
  },
  
  {
    labelKey: "payments",
    href: "/dashboard/payments",
    icon: "$",
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  {
    labelKey: "users",
    href: "/dashboard/users",
    icon: "♧",
    roles: ["MANAGER"],
  },
  {
    labelKey: "auditLogs",
    href: "/dashboard/audit-logs",
    icon: "≡",
    roles: ["MANAGER"],
  },
  {
    labelKey: "settings",
    href: "/dashboard/settings",
    icon: "⚙",
    roles: ["MANAGER"],
  },
];

const roleTranslationKeys: Record<UserRole, TranslationKey> = {
  MANAGER: "roleManager",
  ACCOUNTANT: "roleAccountant",
  SALES: "roleSales",
};

export function Sidebar({
  role,
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { direction, language, t } = useLanguage();

  const isRtl = direction === "rtl";

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 flex w-72 flex-col bg-white transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          isRtl
            ? `right-0 border-l border-slate-200 ${
                mobileOpen ? "translate-x-0" : "translate-x-full"
              }`
            : `left-0 border-r border-slate-200 ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-xl font-black text-white">
              {t("logo")}
          </div>

         <div>
  <h1 className="text-lg font-extrabold text-slate-900">
    {t("appName")}
  </h1>
  <p className="text-xs text-slate-500">
    {t("appTagline")}
  </p>
</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeMenu")}
            className={`rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden ${
              isRtl ? "mr-auto" : "ml-auto"
            }`}
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-5">
          <p className="mb-1 text-xs text-slate-500">
            {t("accountType")}
          </p>

          <p className="text-sm font-bold text-teal-800">
            {t(roleTranslationKeys[role])}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold text-slate-400">
            {t("mainMenu")}
          </p>

          {visibleItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-lg ${
                    active
                      ? "bg-teal-100 text-teal-800"
                      : "text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{t(item.labelKey)}</span>

                {active && (
                  <span
                    className={`h-2 w-2 rounded-full bg-teal-700 ${
                      isRtl ? "mr-auto" : "ml-auto"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-5">
          <p className="text-center text-xs text-slate-400">
            Aqar Lite © {new Date().getFullYear()}
          </p>
        </div>
      </aside>
    </>
  );
}
