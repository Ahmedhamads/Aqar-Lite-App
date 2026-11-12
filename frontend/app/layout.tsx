

import type { Metadata } from "next";

import { AuthProvider } from "@/features/auth/auth-provider";
import { LanguageProvider } from "@/features/language/language-provider";
import { DynamicMetadata } from "@/components/shared/dynamic-metadata";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aqar Lite | عقار لايت",
    template: "%s | Aqar Lite",
  },
  description:
    "Real Estate Management System | نظام إدارة العقارات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">
        <LanguageProvider>
          <DynamicMetadata />
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
