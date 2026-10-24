"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { getHabitMonthAction } from "@/app/[locale]/actions";
import { isScheduledDay } from "@/lib/habit_schedule";
import type { HabitWithLog } from "@/lib/types";

type MonthLogs = { completed: Set<string>; failed: Set<string> };
type CellKind = "done" | "failed" | "violated" | "clean" | "missed" | "open" | "off" | "future";

// Expanded month calendar for one habit card (Habit-Rabbit / Loop style), with
// ◀ ▶ month navigation. Fetched months are cached; the dashboard's fresh data
// (this week's logs + the viewed day's optimistic state) is laid over the top
// so a tick shows up here immediately.
export function HabitMonthView({
  habit,
  today,
  currentDate,
}: {
  habit: HabitWithLog;
  /** Real today in the user's timezone (YYYY-MM-DD). */
  today: string;
  /** Day the dashboard is showing; the calendar opens on its month. */
  currentDate: string;
}) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseISO(currentDate)));
  const [cache, setCache] = useState<Record<string, MonthLogs | "error">>({});

  const monthKey = format(viewMonth, "yyyy-MM");
  const fetched = cache[monthKey];

  useEffect(() => {
    if (cache[monthKey]) return;
    let cancelled = false;
    getHabitMonthAction(habit.id, monthKey).then((res) => {
      if (cancelled) return;
      setCache((prev) => ({
        ...prev,
        [monthKey]: res.error ? "error" : { completed: new Set(res.completed), failed: new Set(res.failed) },
      }));
    });
    return () => {
      cancelled = true;
    };
    // Only (re)fetch when the month changes; `cache` is read, not watched, so a
    // resolving month doesn't cancel and re-issue the one in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id, monthKey]);

  const isNegative = habit.type === "negative";
  // Weekly-quota habits are "due" every day, but skipping a day isn't a miss.
  const isQuota = habit.frequency.type === "x_times_a_week";

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const monday = parseISO("2024-01-01"); // a known Monday
    return Array.from({ length: 7 }, (_, i) => formatter.format(addDays(monday, i)));
  }, [locale]);

  const monthDays = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const leadingBlanks = (getDay(startOfMonth(viewMonth)) + 6) % 7;
  const isCurrentMonth = isSameMonth(viewMonth, parseISO(today));
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(viewMonth);

  const logs = fetched && fetched !== "error" ? fetched : null;

  const isDone = (key: string): boolean => {
    if (key === currentDate) return habit.isCompleted;
    const weekly = habit.weeklyLogs?.[key];
    if (weekly !== undefined) return weekly;
    return logs?.completed.has(key) ?? false;
  };
  const isFailed = (key: string): boolean => {
    if (key === currentDate) return Boolean(habit.isFailed);
    if (habit.weeklyLogs?.[key] !== undefined) return Boolean(habit.weeklyFailed?.[key]);
    return logs?.failed.has(key) ?? false;
  };

  const kindOf = (day: Date, key: string): CellKind => {
    if (key > today) return "future";
    if (habit.createdAt && key < habit.createdAt) return "off";
    const done = isDone(key);
    if (isNegative) {
      if (done) return "violated";
      return key === today ? "open" : "clean";
    }
    if (done) return "done";
    if (isFailed(key)) return "failed";
    if (!isScheduledDay(day, habit.frequency)) return "off";
    if (key === today || isQuota) return "open";
    return "missed";
  };

  const cells = monthDays.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return { day, key, kind: kindOf(day, key) };
  });

  // Summary: "good" days over days that already counted (today only once it's good).
  const good = cells.filter((c) => c.kind === "done" || c.kind === "clean").length;
  const counted = cells.filter((c) => ["done", "clean", "failed", "violated", "missed"].includes(c.kind)).length;
  const rate = counted > 0 ? Math.round((good / counted) * 100) : 0;

  // Longest run of good days; days that don't count (off/open) neither extend nor break it.
  let longestRun = 0;
  let run = 0;
  for (const c of cells) {
    if (c.kind === "done" || c.kind === "clean") {
      run++;
      longestRun = Math.max(longestRun, run);
    } else if (c.kind === "failed" || c.kind === "violated" || c.kind === "missed") {
      run = 0;
    }
  }

  const CELL_STYLES: Record<CellKind, string> = {
    done: "bg-theme-accent text-white border-transparent",
    clean: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-400 text-white border-transparent",
    violated: "bg-red-400 text-white border-transparent",
    missed: "bg-black/[0.08] text-theme-text/50 border-transparent",
    open: "bg-black/[0.03] text-theme-text/50 border-black/[0.06]",
    off: "bg-transparent text-theme-text/20 border-transparent",
    future: "bg-transparent text-theme-text/20 border-dashed border-black/[0.06]",
  };

  const cellTitle = (kind: CellKind): string | undefined => {
    if (kind === "done") return t("completedText");
    if (kind === "clean") return t("noViolate");
    if (kind === "failed") return t("failedText");
    if (kind === "violated") return t("violate");
    if (kind === "missed" || kind === "open") return t("notDone");
    return undefined;
  };

  return (
    <div className="mt-3 pt-3 border-t border-black/[0.03]">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          aria-label={t("prevMonth")}
          className="w-8 h-8 rounded-full hover:bg-theme-accent-light flex items-center justify-center text-theme-text/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-sm font-black text-theme-accent capitalize">{monthTitle}</div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          disabled={isCurrentMonth}
          aria-label={t("nextMonth")}
          className="w-8 h-8 rounded-full hover:bg-theme-accent-light flex items-center justify-center text-theme-text/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="text-center text-[9px] font-black text-theme-text/35 uppercase">
            {label}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 transition-opacity ${fetched ? "" : "opacity-40 animate-pulse"}`}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {cells.map(({ day, key, kind }) => (
          <div
            key={key}
            title={cellTitle(kind)}
            className={`aspect-square max-h-9 w-full mx-auto rounded-full border flex items-center justify-center text-[10px] font-extrabold select-none ${CELL_STYLES[kind]} ${
              key === today ? "outline outline-2 outline-offset-1 outline-amber-400" : ""
            }`}
          >
            {kind === "failed" || kind === "violated" ? "✕" : format(day, "d")}
          </div>
        ))}
      </div>

      {fetched === "error" ? (
        <p className="mt-2 text-center text-[11px] font-bold text-red-400">{t("monthLoadError")}</p>
      ) : (
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] font-bold text-theme-text/50">
          <span>{t(isNegative ? "monthSummaryNegative" : "monthSummary", { good, total: counted, rate })}</span>
          {longestRun > 0 && <span className="text-orange-600">🔥 {t("longestRunMonth", { count: longestRun })}</span>}
        </div>
      )}
    </div>
  );
}
