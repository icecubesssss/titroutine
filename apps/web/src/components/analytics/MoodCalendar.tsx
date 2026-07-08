"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
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

export interface MoodLogEntry {
  mood: string;
  activities: string[];
  note: string | null;
}

interface MoodCalendarProps {
  /** "YYYY-MM-DD" -> entry, from getAnalyticsData. */
  moodLogs: Record<string, MoodLogEntry>;
  /** Today in the user's timezone ("YYYY-MM-DD"). */
  today: string;
}

// Mirrors the palette of MoodCheckinModal (labels come from its i18n namespace).
const MOOD_META: Record<string, { emoji: string; cellClass: string; textClass: string }> = {
  awful: { emoji: "😭", cellClass: "bg-red-100 border-red-300", textClass: "text-red-700" },
  bad: { emoji: "🙁", cellClass: "bg-blue-100 border-blue-300", textClass: "text-blue-700" },
  neutral: { emoji: "😐", cellClass: "bg-amber-100 border-amber-300", textClass: "text-amber-700" },
  good: { emoji: "🙂", cellClass: "bg-emerald-100 border-emerald-300", textClass: "text-emerald-700" },
  awesome: { emoji: "😆", cellClass: "bg-pink-100 border-pink-300", textClass: "text-pink-700" },
};

export const MoodCalendar: React.FC<MoodCalendarProps> = ({ moodLogs, today }) => {
  const t = useTranslations("MoodCalendar");
  const tMood = useTranslations("MoodCheckinModal");
  const locale = useLocale();

  const todayDate = parseISO(today);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(todayDate));
  const [selectedDate, setSelectedDate] = useState<string | null>(
    moodLogs[today] ? today : null
  );

  // Monday-first weekday headers in the viewer's locale (app weeks start Monday).
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const monday = parseISO("2024-01-01"); // a known Monday
    return Array.from({ length: 7 }, (_, i) => formatter.format(addDays(monday, i)));
  }, [locale]);

  const monthDays = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  // Leading blanks so day 1 lands under its weekday (Monday-first).
  const leadingBlanks = (getDay(startOfMonth(viewMonth)) + 6) % 7;

  const isCurrentMonth = isSameMonth(viewMonth, todayDate);
  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(viewMonth);
  const checkedInCount = monthDays.filter((d) => moodLogs[format(d, "yyyy-MM-dd")]).length;

  const selectedEntry = selectedDate ? moodLogs[selectedDate] : null;
  const selectedMeta = selectedEntry ? MOOD_META[selectedEntry.mood] : null;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          aria-label={t("prevMonth")}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <div className="font-black text-stone-700 capitalize">{monthTitle}</div>
          <div className="text-[11px] font-bold text-stone-400 mt-0.5">
            {t("checkedIn", { count: checkedInCount })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          disabled={isCurrentMonth}
          aria-label={t("nextMonth")}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-black text-stone-400 uppercase">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {monthDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = moodLogs[key];
          const meta = entry ? MOOD_META[entry.mood] : null;
          const isToday = key === today;
          const isFuture = key > today;
          const isSelected = key === selectedDate;

          return (
            <button
              key={key}
              type="button"
              disabled={!entry}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              title={entry ? tMood(entry.mood) : undefined}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                meta
                  ? `${meta.cellClass} cursor-pointer hover:scale-105 active:scale-95 ${
                      isSelected ? "ring-2 ring-orange-400 scale-105" : ""
                    }`
                  : isFuture
                    ? "bg-stone-50/50 border-stone-100 text-stone-200"
                    : "bg-stone-50 border-stone-100 text-stone-300"
              } ${isToday ? "outline outline-2 outline-offset-1 outline-orange-300" : ""}`}
            >
              {meta ? (
                <span className="text-base leading-none select-none">{meta.emoji}</span>
              ) : (
                <span className="text-[10px] font-bold">{format(day, "d")}</span>
              )}
              {meta && (
                <span className={`text-[8px] font-black leading-none mt-0.5 ${meta.textClass}`}>
                  {format(day, "d")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Journal detail for the selected day */}
      {selectedEntry && selectedMeta ? (
        <div className={`mt-4 rounded-2xl border-2 p-4 ${selectedMeta.cellClass}`}>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none">{selectedMeta.emoji}</span>
            <div>
              <div className={`text-sm font-black ${selectedMeta.textClass}`}>
                {tMood(selectedEntry.mood)}
              </div>
              <div className="text-[11px] font-bold text-stone-500">
                {new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(parseISO(selectedDate!))}
              </div>
            </div>
          </div>
          {selectedEntry.activities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedEntry.activities.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/70 border border-white/80 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  {tMood(tag)}
                </span>
              ))}
            </div>
          )}
          {selectedEntry.note && (
            <p className="mt-3 text-xs font-medium text-stone-600 leading-relaxed bg-white/60 rounded-xl px-3 py-2 whitespace-pre-wrap">
              “{selectedEntry.note}”
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-[11px] font-medium text-stone-400">
          {t("selectHint")}
        </p>
      )}
    </div>
  );
};
