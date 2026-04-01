"use client";

import { useState, useCallback, useEffect } from "react";
import az from "@/lib/i18n/az.json";
import en from "@/lib/i18n/en.json";

export type Locale = "az" | "en";

const LOCALE_KEY = "shade_locale";

const translations: Record<Locale, Record<string, unknown>> = { az, en };

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // fallback: return key path
    }
  }
  return typeof current === "string" ? current : path;
}

function getSavedLocale(): Locale {
  if (typeof window === "undefined") return "az";
  const saved = localStorage.getItem(LOCALE_KEY);
  if (saved === "en" || saved === "az") return saved;
  return "az";
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale);

  useEffect(() => {
    // Sync with localStorage on mount (for SSR hydration)
    const saved = getSavedLocale();
    if (saved !== locale) setLocaleState(saved);

    // Listen for locale changes from other components
    function onStorage(e: StorageEvent) {
      if (e.key === LOCALE_KEY && (e.newValue === "az" || e.newValue === "en")) {
        setLocaleState(e.newValue);
      }
    }
    // Custom event for same-tab broadcast
    function onLocaleChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail === "az" || detail === "en") {
        setLocaleState(detail);
      }
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("shade:locale", onLocaleChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("shade:locale", onLocaleChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_KEY, newLocale);
    // Broadcast to other components in the same tab
    window.dispatchEvent(new CustomEvent("shade:locale", { detail: newLocale }));
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(translations[locale], key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [locale]
  );

  return { t, locale, setLocale };
}

/** Get translation without hook (for non-component contexts) */
export function getTranslation(locale?: Locale) {
  const l = locale || getSavedLocale();
  return (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[l], key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }
    return value;
  };
}
