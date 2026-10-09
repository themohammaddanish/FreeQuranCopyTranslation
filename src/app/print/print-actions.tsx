"use client";

import { useEffect } from "react";

export default function PrintActions() {
  useEffect(() => {
    let timeoutId: number | undefined;
    let cancelled = false;

    void document.fonts.ready.then(() => {
      if (!cancelled) {
        timeoutId = window.setTimeout(() => window.print(), 400);
      }
    });

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="print-toolbar">
      <p>In the print dialog, select <strong>Save as PDF</strong> to download your copy.</p>
      <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
    </div>
  );
}
