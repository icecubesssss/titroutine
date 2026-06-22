"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DuoButton } from "@/components/ui/DuoButton";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const formData = new FormData(e.currentTarget);
    formData.set("locale", locale);

    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      // A successful auth redirects server-side; we only get here on a result.
      if (result?.error) {
        setError(translateError(result.error));
      } else if (result?.message === "check_email") {
        setInfo(t("checkEmail"));
      }
    });
  };

  const translateError = (code: string) => {
    if (code === "missing_fields") return t("errorMissing");
    if (code === "weak_password") return t("errorWeakPassword");
    if (/invalid login credentials/i.test(code)) return t("errorInvalid");
    if (/already registered|already exists/i.test(code)) return t("errorExists");
    return code;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-earth-bg p-6 text-earth-text">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="text-6xl">🐰</span>
          <h1 className="text-3xl font-black tracking-tight">Titroutine</h1>
          <p className="text-sm font-medium text-gray-500">{t("tagline")}</p>
        </div>

        {/* Mode switch */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setInfo(null);
            }}
            className={`rounded-xl py-2 text-sm font-bold transition-colors ${
              mode === "signin" ? "bg-fire-red text-white" : "text-gray-400"
            }`}
          >
            {t("signIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setInfo(null);
            }}
            className={`rounded-xl py-2 text-sm font-bold transition-colors ${
              mode === "signup" ? "bg-fire-red text-white" : "text-gray-400"
            }`}
          >
            {t("signUp")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-bold">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 transition-colors focus:border-fire-orange focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-bold">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-3 transition-colors focus:border-fire-orange focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">{info}</p>
          )}

          <DuoButton type="submit" variant="primary" fullWidth size="lg" disabled={isPending}>
            {isPending ? t("loading") : mode === "signin" ? t("signIn") : t("signUp")}
          </DuoButton>
        </form>
      </div>
    </main>
  );
}
