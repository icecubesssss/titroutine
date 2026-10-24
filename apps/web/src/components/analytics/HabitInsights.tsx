"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { addDays, parseISO } from "date-fns";
import type { HabitStat, MoodInsight, WeekRecap } from "@/lib/analytics";

const MOOD_EMOJI: Record<string, string> = {
  awful: "😭",
  bad: "🙁",
  neutral: "😐",
  good: "🙂",
  awesome: "😆",
};

const CARD = "bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100";

/** "Your week": completions so far vs the same weekdays last week, best habit, top mood. */
export function WeekRecapCard({ recap }: { recap: WeekRecap }) {
  const t = useTranslations("Analytics");
  const tMood = useTranslations("MoodCheckinModal");
  const diff = recap.thisWeek - recap.lastWeekSamePeriod;

  return (
    <div className={`${CARD} flex flex-col gap-3`}>
      <h3 className="font-bold text-gray-700">🗓️ {t("weekRecapTitle")}</h3>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-4xl font-black text-emerald-600 tabular-nums">{recap.thisWeek}</span>
        <span className="text-sm font-bold text-stone-500">{t("weekCompletions")}</span>
        <span
          className={`text-xs font-black px-2 py-0.5 rounded-full ${
            diff > 0 ? "bg-emerald-50 text-emerald-700" : diff < 0 ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-500"
          }`}
        >
          {diff > 0 ? "↑ " : diff < 0 ? "↓ " : ""}
          {diff === 0 ? t("sameAsLastWeek") : t("vsLastWeek", { diff: Math.abs(diff) })}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm font-medium text-stone-600">
        {recap.bestHabit ? (
          <span>⭐ {t("bestHabitWeek", { title: recap.bestHabit })}</span>
        ) : (
          <span className="text-stone-400">{t("noActivityWeek")}</span>
        )}
        {recap.topMood && (
          <span>
            {MOOD_EMOJI[recap.topMood] ?? "🙂"} {t("topMoodWeek", { mood: tMood(recap.topMood) })}
          </span>
        )}
      </div>
    </div>
  );
}

/** Completion rate per weekday (single series → one hue, no legend, hover for the value). */
export function WeekdayChart({ rates }: { rates: (number | null)[] }) {
  const t = useTranslations("Analytics");
  const locale = useLocale();
  const labels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const monday = parseISO("2024-01-01"); // a known Monday
    return Array.from({ length: 7 }, (_, i) => formatter.format(addDays(monday, i)));
  }, [locale]);

  const hasData = rates.some((r) => r !== null);
  const best = hasData ? rates.indexOf(Math.max(...rates.map((r) => r ?? -1))) : -1;

  return (
    <div className={CARD}>
      <h3 className="font-bold text-gray-700 mb-1">📊 {t("weekdayTitle")}</h3>
      {hasData ? (
        <>
          <p className="text-xs font-medium text-stone-400 mb-4">{t("weekdayBest", { day: labels[best] })}</p>
          <div className="flex items-end justify-between gap-2 h-36" role="list">
            {rates.map((rate, i) => (
              <div
                key={i}
                role="listitem"
                aria-label={`${labels[i]}: ${rate ?? "—"}%`}
                className="group relative flex-1 h-full flex flex-col justify-end items-center"
              >
                <span className="absolute -top-1 text-[11px] font-black text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {rate === null ? "—" : `${rate}%`}
                </span>
                <div
                  className={`w-full max-w-[36px] rounded-t-[4px] transition-colors ${
                    i === best ? "bg-green-600" : "bg-green-400 group-hover:bg-green-500"
                  }`}
                  style={{ height: `${Math.max(rate ?? 0, 2)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2 mt-2 border-t border-stone-200 pt-1.5">
            {labels.map((label, i) => (
              <span key={i} className="flex-1 text-center text-[10px] font-bold text-stone-400 uppercase">
                {label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm font-medium text-stone-400 py-6 text-center">{t("notEnoughData")}</p>
      )}
    </div>
  );
}

/** Per-habit table: 30-day rate, strength, streak. */
export function HabitStatsTable({ stats }: { stats: HabitStat[] }) {
  const t = useTranslations("Analytics");

  return (
    <div className={CARD}>
      <h3 className="font-bold text-gray-700 mb-4">🌱 {t("habitsTitle")}</h3>
      {stats.length === 0 ? (
        <p className="text-sm font-medium text-stone-400 text-center py-4">{t("noHabits")}</p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-black uppercase text-stone-400 text-left">
                <th className="px-2 pb-2 font-black">{t("colHabit")}</th>
                <th className="px-2 pb-2 font-black text-right">{t("col30d")}</th>
                <th className="px-2 pb-2 font-black text-right" title={t("strengthHint")}>{t("colStrength")}</th>
                <th className="px-2 pb-2 font-black text-right">{t("colStreak")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id} className="border-t border-stone-100">
                  <td className="px-2 py-2.5 font-bold text-stone-700 max-w-[10rem] truncate">
                    {s.isNegative && <span aria-hidden="true">💥 </span>}
                    {s.title}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold text-stone-600 tabular-nums">
                    {s.rate30 === null ? "—" : `${s.rate30}%`}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <div className="hidden sm:block w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden" aria-hidden="true">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${s.strength}%` }} />
                      </div>
                      <span className="font-bold text-stone-600 tabular-nums">{s.strength}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold text-orange-600 tabular-nums whitespace-nowrap">
                    {s.streak === null || s.streak === 0
                      ? "—"
                      : s.isWeekly
                      ? t("streakWeeks", { count: s.streak })
                      : t("streakDays", { count: s.streak })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Mood ↔ habit: which habits line up with better (or worse) days. */
export function MoodInsights({ insights }: { insights: MoodInsight[] }) {
  const t = useTranslations("Analytics");

  return (
    <div className={CARD}>
      <h3 className="font-bold text-gray-700 mb-4">💞 {t("moodInsightsTitle")}</h3>
      {insights.length === 0 ? (
        <p className="text-sm font-medium text-stone-400 text-center py-4">{t("moodInsightsEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {insights.map((ins) => {
            const up = ins.diff > 0;
            const key = ins.isNegative ? (up ? "moodSlipUp" : "moodSlipDown") : up ? "moodDoneUp" : "moodDoneDown";
            return (
              <li
                key={ins.title}
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  up ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                }`}
              >
                {up ? "📈 " : "📉 "}
                {t(key, { habit: ins.title, diff: Math.abs(ins.diff) })}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[11px] font-medium text-stone-400">{t("moodInsightsNote")}</p>
    </div>
  );
}
