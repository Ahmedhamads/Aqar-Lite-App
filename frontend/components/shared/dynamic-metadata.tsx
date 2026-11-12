
"use client";

import { useEffect } from "react";
import { useLanguage } from "@/features/language/language-provider";

export function DynamicMetadata() {
  const { language, t } = useLanguage();

  useEffect(() => {
    document.title =
      language === "ar"
        ? "عقار لايت | نظام إدارة العقارات"
        : "Aqar Lite | Real Estate Management";

    const description =
      language === "ar"
        ? "نظام متكامل لإدارة العقارات والعملاء والحجوزات والعقود والأقساط."
        : "An integrated system for managing properties, clients, reservations, contracts and installments.";

    let meta = document.querySelector(
      'meta[name="description"]',
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", description);
  }, [language]);

  return null;
}
