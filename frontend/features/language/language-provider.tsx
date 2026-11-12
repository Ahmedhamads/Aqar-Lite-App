"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  translations,
  type Language,
  type TranslationKey,
} from "./translations";

interface LanguageContextValue {
  language: Language;
  direction: "rtl" | "ltr";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = "aqar-language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("ar");
  const [isInitialized, setIsInitialized] = useState(false);

  const direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEY);

    const initialLanguage: Language =
      savedLanguage === "en" ? "en" : "ar";

    setLanguageState(initialLanguage);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    document.documentElement.lang = language;
    document.documentElement.dir = direction;

    localStorage.setItem(STORAGE_KEY, language);
  }, [language, direction, isInitialized]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) =>
      current === "ar" ? "en" : "ar",
    );
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key],
    [language],
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider",
    );
  }

  return context;
}