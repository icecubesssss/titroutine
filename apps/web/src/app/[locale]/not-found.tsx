import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// Rendered for notFound() anywhere under [locale], including unknown paths
// (caught by [...rest]/page.tsx).
export default function NotFound() {
  const t = useTranslations("System");
  const locale = useLocale();

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-earth-bg px-6 text-center text-earth-text">
      <span className="text-6xl select-none" aria-hidden="true">🕳️🐰</span>
      <h1 className="text-xl font-black">{t("notFoundTitle")}</h1>
      <p className="max-w-sm text-sm font-medium text-theme-text/60">{t("notFoundBody")}</p>
      <Link
        href={`/${locale}`}
        className="rounded-full bg-theme-accent px-5 py-2 text-sm font-black text-white shadow-sm hover:brightness-110"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
