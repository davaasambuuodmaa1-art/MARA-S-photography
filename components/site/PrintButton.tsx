"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print btn-outline"
    >
      Print / save PDF
    </button>
  );
}
