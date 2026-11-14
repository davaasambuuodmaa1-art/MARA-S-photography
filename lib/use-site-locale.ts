"use client";

import { useEffect, useState } from "react";
import { SITE_LOCALE_COOKIE, getSiteLocale, type SiteLocale } from "@/lib/site-locale";

export function useSiteLocale(): SiteLocale {
  const [locale, setLocale] = useState<SiteLocale>("en");

  useEffect(() => {
    const readLocale = () => {
      const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${SITE_LOCALE_COOKIE}=`));
      setLocale(getSiteLocale(cookie?.split("=")[1]));
    };
    readLocale();
    window.addEventListener("site-locale-change", readLocale);
    return () => window.removeEventListener("site-locale-change", readLocale);
  }, []);

  return locale;
}
