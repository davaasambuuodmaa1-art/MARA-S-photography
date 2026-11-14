"use client";

import { useSiteLocale } from "@/lib/use-site-locale";

export function PrintButton() {
  const mn = useSiteLocale() === "mn";
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print btn-outline"
    >
      {mn ? "Хэвлэх / PDF хадгалах" : "Print / save PDF"}
    </button>
  );
}
