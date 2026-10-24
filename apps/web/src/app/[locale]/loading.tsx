import { useTranslations } from "next-intl";

// Shown while a server page under [locale] streams in (first load, analytics).
// Date navigation on the home page runs inside a transition, so it keeps the
// old UI instead of flashing this.
export default function Loading() {
  const t = useTranslations("System");

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-earth-bg text-earth-text">
      <span className="text-6xl animate-bounce select-none" aria-hidden="true">🐰</span>
      <p className="text-sm font-bold text-theme-text/60" role="status">{t("loading")}</p>
    </main>
  );
}
