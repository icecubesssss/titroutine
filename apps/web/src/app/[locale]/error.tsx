"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { DuoButton } from "@/components/ui/DuoButton";

// Error boundary for every page under [locale]: a friendly message instead of
// Next's raw error screen, with a retry that re-renders the segment.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("System");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-earth-bg px-6 text-center text-earth-text">
      <span className="text-6xl select-none" aria-hidden="true">🥕</span>
      <h1 className="text-xl font-black">{t("errorTitle")}</h1>
      <p className="max-w-sm text-sm font-medium text-theme-text/60">{t("errorBody")}</p>
      <DuoButton variant="primary" onClick={reset}>
        {t("retry")}
      </DuoButton>
    </main>
  );
}
