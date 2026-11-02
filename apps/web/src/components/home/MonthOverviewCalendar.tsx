"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import type { HabitWithLog, Task } from "@/lib/types";

interface MonthOverviewCalendarProps {
  currentDate: string;
  today: string;
  habits: HabitWithLog[];
  tasks: Task[];
  moodLogs?: Record<string, { mood: string; activities: string[]; note: string | null }>;
  onSelectDate: (dateStr: string) => void;
  onBackToWeek: () => void;
}

const WEEKDAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MOOD_EMOJIS: Record<string, string> = {
  awesome: "😆",
  good: "🙂",
  neutral: "😐",
  bad: "🙁",
  awful: "😭",
};

export const MonthOverviewCalendar: React.FC<MonthOverviewCalendarProps> = ({
  currentDate,
  today,
  habits,
  tasks,
  moodLogs = {},
  onSelectDate,
  onBackToWeek,
}) => {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseISO(currentDate || today)));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = (getDay(monthStart) + 6) % 7; // Monday-indexed (0=Mon, 6=Sun)

  // Tasks mapped by deadline date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.deadline) {
        const d = t.deadline.slice(0, 10);
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [tasks]);

  const selectedDayTasks = tasksByDate[currentDate] || [];
  const selectedDayMood = moodLogs[currentDate];

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Month Navigation Header */}
      <div className="bg-theme-card-bg p-4 rounded-3xl border border-theme-card-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Tháng trước"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="p-1.5 hover:bg-theme-accent-light rounded-full text-theme-text/60 hover:text-theme-accent transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-base font-black text-theme-text min-w-[140px] text-center">
            {format(viewMonth, "Tháng MM / yyyy")}
          </h3>
          <button
            type="button"
            aria-label="Tháng sau"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-1.5 hover:bg-theme-accent-light rounded-full text-theme-text/60 hover:text-theme-accent transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isSameMonth(viewMonth, parseISO(today)) && (
            <button
              type="button"
              onClick={() => setViewMonth(startOfMonth(parseISO(today)))}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              Về tháng này
            </button>
          )}
          <button
            type="button"
            onClick={onBackToWeek}
            className="bg-theme-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs hover:brightness-105 transition-all flex items-center gap-1"
          >
            Xem tuần <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* 7-column Calendar Grid */}
      <div className="bg-theme-card-bg p-4 rounded-3xl border border-theme-card-border shadow-xs">
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
          {WEEKDAY_HEADERS.map((dayName, idx) => (
            <div
              key={dayName}
              className={`text-[11px] font-black uppercase tracking-wider py-1 ${
                idx >= 5 ? "text-orange-500" : "text-stone-400"
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Leading empty slots */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[64px] rounded-2xl bg-stone-50/40" />
          ))}

          {/* Days */}
          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isToday = dateStr === today;
            const isSelected = dateStr === currentDate;
            const dayNum = format(day, "d");
            const mood = moodLogs[dateStr];
            const dayTasks = tasksByDate[dateStr] || [];
            const pendingTasks = dayTasks.filter((t) => t.status !== "done").length;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className={`min-h-[64px] p-1.5 rounded-2xl border-2 flex flex-col justify-between items-start transition-all relative ${
                  isSelected
                    ? "border-theme-accent bg-theme-accent-light/40 shadow-xs scale-[1.02] z-10"
                    : isToday
                    ? "border-amber-400 bg-amber-50/60"
                    : "border-stone-100 bg-white hover:border-theme-accent-light hover:bg-stone-50/50"
                }`}
              >
                {/* Day number & indicators */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-xs font-black rounded-full w-5 h-5 flex items-center justify-center ${
                      isToday
                        ? "bg-amber-500 text-white"
                        : isSelected
                        ? "text-theme-accent"
                        : "text-stone-700"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {mood && (
                    <span className="text-sm select-none" title={`Cảm xúc: ${mood.mood}`}>
                      {MOOD_EMOJIS[mood.mood] || "🙂"}
                    </span>
                  )}
                </div>

                {/* Tasks Badge */}
                <div className="w-full flex items-center justify-end gap-1 mt-1">
                  {pendingTasks > 0 && (
                    <span
                      className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight"
                      title={`${pendingTasks} việc cần làm`}
                    >
                      {pendingTasks}
                    </span>
                  )}
                  {dayTasks.length > 0 && pendingTasks === 0 && (
                    <span
                      className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight"
                      title="Đã xong hết việc"
                    >
                      ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Summary Card */}
      <div className="bg-white p-5 rounded-3xl border-2 border-[#ebdcc5] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <h4 className="text-sm font-black text-stone-800">
                {format(parseISO(currentDate), "EEEE, 'ngày' dd 'tháng' MM, yyyy")}
              </h4>
              <p className="text-[11px] text-stone-400">
                {currentDate === today ? "Hôm nay" : "Ngày đang chọn"}
              </p>
            </div>
          </div>
          {selectedDayMood && (
            <div className="flex items-center gap-1.5 bg-pink-50 border border-pink-200 px-3 py-1 rounded-full text-xs font-bold text-pink-700">
              <span>{MOOD_EMOJIS[selectedDayMood.mood]}</span>
              <span>Cảm xúc: {selectedDayMood.mood}</span>
            </div>
          )}
        </div>

        {/* Selected date tasks */}
        <div className="pt-2 border-t border-stone-100">
          <h5 className="text-xs font-black text-stone-500 uppercase tracking-wider mb-2">
            Công việc ({selectedDayTasks.length})
          </h5>
          {selectedDayTasks.length === 0 ? (
            <p className="text-xs text-stone-400 italic">Không có công việc nào có hạn chót vào ngày này.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    t.status === "done"
                      ? "bg-emerald-50/50 border-emerald-200 text-stone-500 line-through"
                      : "bg-stone-50 border-stone-200 text-stone-800 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-theme-accent shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {t.status === "done" ? "Đã xong" : `${t.focusDuration}m`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
