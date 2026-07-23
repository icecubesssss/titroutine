"use client";

import { useState } from "react";
import { type RefObject } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO, subWeeks, addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Pencil, CheckCircle, Lock, Globe, Users, Filter } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import { CarrotPlanting } from "@/components/tasks/CarrotPlanting";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import type { DashboardData, HabitWithLog } from "@/lib/types";
import { toggleHabitPrivacyAction } from "@/app/[locale]/actions";

// Bottom half of the home screen (scrolls internally). Two tabs share the pane:
// the weekly habit list + DailyBean mood grid, or the task board. The weekly
// header (week nav + day strip) is shared by both tabs; only the habits tab
// shows the completion badge. All navigation and mutations are delegated to
// HomeView via callbacks so this stays a pure view.
export function HabitsPanel({
  scrollRef,
  data,
  habits,
  activeTab,
  isNavigating,
  completedCount,
  totalCount,
  pendingIds,
  onSelectDate,
  onToday,
  onRefresh,
  onEditHabit,
  onToggle,
  onDoIt,
  onIncrement,
}: {
  scrollRef: RefObject<HTMLElement>;
  data: DashboardData;
  habits: HabitWithLog[];
  activeTab: "habits" | "tasks";
  isNavigating: boolean;
  completedCount: number;
  totalCount: number;
  pendingIds: Set<string>;
  onSelectDate: (dateStr: string) => void;
  onToday: () => void;
  onRefresh: () => void;
  onEditHabit: (habit: HabitWithLog) => void;
  onToggle: (habit: HabitWithLog) => void;
  onDoIt: (habit: HabitWithLog) => void;
  onIncrement: (habit: HabitWithLog, amount: number) => void;
}) {
  const t = useTranslations("Home");
  const [localPrivate, setLocalPrivate] = useState<Record<string, boolean>>({});

  const handleTogglePrivacy = async (habit: HabitWithLog) => {
    const current = localPrivate[habit.id] ?? habit.isPrivate ?? false;
    const nextVal = !current;
    setLocalPrivate((prev) => ({ ...prev, [habit.id]: nextVal }));
    await toggleHabitPrivacyAction(habit.id, nextVal);
    onRefresh();
  };

  // Shared weekly header: week navigation + day strip. Rendered above both tabs
  // so tasks get the same week bar; the completion badge is habits-only.
  const weekHeader = (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-theme-card-bg px-2 py-1 rounded-full shadow-sm border border-theme-card-border">
          <button
            type="button"
            aria-label={t("prevDay")}
            onClick={() => onSelectDate(format(subWeeks(parseISO(data.currentDate), 1), "yyyy-MM-dd"))}
            className="p-1 hover:bg-theme-accent-light rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-theme-text/60" />
          </button>
          <div className="text-sm font-bold text-theme-accent text-center min-w-[110px]">
            {data.weekDates ? `${format(parseISO(data.weekDates[0]), "dd/MM")} - ${format(parseISO(data.weekDates[6]), "dd/MM")}` : format(parseISO(data.currentDate), "dd/MM/yyyy")}
          </div>
          <button
            type="button"
            aria-label={t("nextDay")}
            onClick={() => onSelectDate(format(addWeeks(parseISO(data.currentDate), 1), "yyyy-MM-dd"))}
            className="p-1 hover:bg-theme-accent-light rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-theme-text/60" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!data.isToday && (
            <button
              type="button"
              onClick={onToday}
              className="bg-theme-accent text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider hover:brightness-110"
            >
              Hôm nay
            </button>
          )}
          {activeTab === "habits" && (
            <span className="text-sm font-bold text-theme-text bg-theme-card-bg px-3 py-1.5 rounded-full shadow-sm border border-theme-card-border">
              {t("completed", { completed: completedCount, total: totalCount })}
            </span>
          )}
        </div>
      </div>

      {/* DailyBean Mood Grid: Days of Week row */}
      {data.weekDates && (
        <div className="flex justify-between bg-theme-card-bg p-2 rounded-3xl shadow-sm border border-theme-card-border">
          {data.weekDates.map((dateStr, i) => {
            const dateObj = parseISO(dateStr);
            const isSelected = dateStr === data.currentDate;
            const isRealToday = dateStr === data.today;
            const dayNames = t("weekdaysShort").split(",");

            // Trích xuất thông tin cảm xúc từ logs
            const moodLog = data.moodLogs?.[dateStr];

            const MOOD_DESIGNS: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
              awesome: { bg: "bg-pink-100 hover:bg-pink-200 border-pink-200", border: "border-pink-300", text: "text-pink-700", emoji: "😆" },
              good: { bg: "bg-emerald-100 hover:bg-emerald-200 border-emerald-200", border: "border-emerald-300", text: "text-emerald-700", emoji: "🙂" },
              neutral: { bg: "bg-amber-100 hover:bg-amber-200 border-amber-200", border: "border-amber-300", text: "text-amber-700", emoji: "😐" },
              bad: { bg: "bg-blue-100 hover:bg-blue-200 border-blue-200", border: "border-blue-300", text: "text-blue-700", emoji: "🙁" },
              awful: { bg: "bg-red-100 hover:bg-red-200 border-red-200", border: "border-red-300", text: "text-red-700", emoji: "😭" },
            };

            const moodDesign = moodLog ? MOOD_DESIGNS[moodLog.mood] : null;

            let btnStyles = "hover:bg-theme-accent-light text-theme-text/60 border-transparent";
            if (isSelected) {
              btnStyles = "bg-theme-accent text-white shadow-md scale-105 border-transparent";
            } else if (moodDesign) {
              btnStyles = `${moodDesign.bg} ${moodDesign.text} border-2 ${moodDesign.border}`;
            }

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`group flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all relative border ${btnStyles}`}
              >
                {isRealToday && !isSelected && (
                  <span className="absolute -top-1 w-2 h-2 bg-amber-400 rounded-full z-10 animate-pulse"></span>
                )}

                <span className={`text-[9px] font-bold mb-0.5 uppercase tracking-wider ${isSelected ? "text-white/70" : "text-theme-text/40"}`}>
                  {dayNames[i]}
                </span>

                {moodDesign ? (
                  <span className="text-lg leading-none animate-bounce-slow mt-0.5 select-none">{moodDesign.emoji}</span>
                ) : (
                  <span className="text-base font-black leading-none">{format(dateObj, "dd")}</span>
                )}

                {/* Dotted placeholder for missing mood */}
                {!moodDesign && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-black/10 mt-1"></span>
                )}

                {/* Interactive CSS Tooltip Card */}
                {moodLog && moodDesign && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 hidden group-hover:block bg-white/95 border border-amber-900/10 p-3 rounded-2xl shadow-xl z-50 text-left pointer-events-none text-theme-text animate-fade-in">
                    <div className="text-[9px] font-black text-theme-text/35 uppercase tracking-wider mb-1">Nhật ký hôm đó</div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base leading-none">{moodDesign.emoji}</span>
                      <span className={`text-xs font-black capitalize ${moodDesign.text}`}>{moodLog.mood}</span>
                    </div>
                    {moodLog.activities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {moodLog.activities.map(act => (
                          <span key={act} className="text-[8px] font-bold bg-black/[0.04] px-1.5 py-0.5 rounded-full text-theme-text/60">
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                    {moodLog.note && (
                      <p className="text-[10px] font-medium text-theme-text/75 leading-relaxed italic border-t border-black/[0.03] pt-1.5">
                        &ldquo;{moodLog.note}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );

  return (
    <section ref={scrollRef} className={`flex-[1.3] min-h-0 bg-earth-bg p-6 md:p-8 pb-28 overflow-y-visible md:overflow-y-auto transition-opacity duration-300 ${isNavigating ? "opacity-50 pointer-events-none" : ""}`}>
      {weekHeader}

      {activeTab === "habits" ? (
        totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
            <span className="text-4xl">🌱</span>
            <p className="font-medium">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {[
              { id: "morning", label: t("morning"), items: habits.filter(h => h.timeOfDay === "morning") },
              { id: "afternoon", label: t("afternoon"), items: habits.filter(h => h.timeOfDay === "afternoon") },
              { id: "evening", label: t("evening"), items: habits.filter(h => h.timeOfDay === "evening") },
              { id: "anytime", label: t("anytime"), items: habits.filter(h => !h.timeOfDay || h.timeOfDay === "anytime") }
            ].map(section => {
              if (section.items.length === 0) return null;
              return (
                <div key={section.id} className="space-y-3">
                  <h3 className="text-lg font-bold text-earth-brown flex items-center gap-2">
                    {section.label}
                  </h3>
                  {section.items.map((habit) => (
                    <div
                      key={habit.id}
                      className={`bg-theme-card-bg p-4 rounded-3xl border flex flex-col transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                        habit.isCompleted
                          ? "border-theme-card-border opacity-60"
                          : habit.type === "negative"
                          ? "border-red-200 bg-red-50/50"
                          : "border-theme-card-border"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4 min-w-0">
                        <button
                          type="button"
                          aria-label={t("edit")}
                          title={t("edit")}
                          onClick={() => onEditHabit(habit)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-colors group relative ${
                            habit.type === "negative" ? "bg-red-100 hover:bg-red-200" : "bg-theme-accent-light hover:bg-theme-border/20"
                          }`}
                        >
                          <span className="group-hover:opacity-0 transition-opacity">
                            {habit.type === "timer" ? "⏳" : habit.type === "negative" ? "💥" : "💧"}
                          </span>
                          <Pencil className={`w-5 h-5 absolute opacity-0 group-hover:opacity-100 transition-opacity ${
                            habit.type === "negative" ? "text-red-500" : "text-theme-accent"
                          }`} />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3
                              className={`font-bold truncate ${
                                habit.isCompleted ? "line-through text-gray-400" : habit.type === "negative" ? "text-red-600" : "text-earth-text"
                              }`}
                            >
                              {habit.title}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleTogglePrivacy(habit)}
                              className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-md hover:bg-stone-100/60 shrink-0"
                              title={(localPrivate[habit.id] ?? habit.isPrivate) ? "Riêng tư (Chỉ mình bạn xem)" : "Công khai (Hàng xóm xem được)"}
                            >
                              {(localPrivate[habit.id] ?? habit.isPrivate) ? (
                                <Lock size={13} className="text-amber-600" />
                              ) : (
                                <Globe size={13} className="text-emerald-600" />
                              )}
                            </button>
                          </div>
                           <p className={`text-sm font-medium ${habit.type === "negative" ? "text-red-400" : "text-gray-400"} flex items-center gap-1.5 flex-wrap`}>
                            <span>
                              {habit.type === "timer" && habit.config.target_time
                                ? t("minutes", { count: Math.round(habit.config.target_time / 60) })
                                : habit.type === "counter" && habit.config.target_count
                                ? t("targetGoal", { count: habit.config.target_count })
                                : habit.type === "negative"
                                ? t("noViolate")
                                : t("daily")}
                            </span>
                            {habit.streak !== undefined && habit.streak > 0 && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-0.5 text-orange-600 font-semibold text-xs">
                                  🔥 {habit.streak} {t("streakDays", { count: habit.streak })}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {habit.isCompleted ? (
                        <button
                          type="button"
                          aria-label={t("undo")}
                          title={t("undo")}
                          disabled={pendingIds.has(habit.id)}
                          onClick={() => onToggle(habit)}
                          className="shrink-0 disabled:opacity-50"
                        >
                          <CheckCircle className={`w-8 h-8 ${habit.type === "negative" ? "text-red-500" : "text-green-500"}`} />
                        </button>
                      ) : habit.type === "counter" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={pendingIds.has(habit.id)}
                            onClick={() => onIncrement(habit, -1)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="font-bold tabular-nums min-w-[2.5rem] text-center text-earth-text">
                            {habit.value || 0}/{habit.config.target_count || 1}
                          </span>
                          <button
                            type="button"
                            disabled={pendingIds.has(habit.id)}
                            onClick={() => onIncrement(habit, 1)}
                            className="w-8 h-8 rounded-full bg-fire-orange flex items-center justify-center font-bold text-white hover:bg-orange-600 shadow-sm disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      ) : habit.type === "negative" ? (
                        <button
                          type="button"
                          disabled={pendingIds.has(habit.id)}
                          onClick={() => onDoIt(habit)}
                          className="shrink-0 bg-red-100 text-red-600 border-2 border-red-200 hover:bg-red-200 font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {t("violate")}
                        </button>
                      ) : (
                        <DuoButton
                          variant="primary"
                          size="sm"
                          className="shrink-0"
                          disabled={pendingIds.has(habit.id)}
                          onClick={() => onDoIt(habit)}
                        >
                          {t("doIt")}
                        </DuoButton>
                      )}
                      </div>

                      {/* Mini Weekly Beans Progress */}
                      {data.weekDates && (
                        <div className="mt-3 pt-2.5 border-t border-black/[0.03] flex items-center justify-between">
                          <span className="text-[10px] font-bold text-theme-text/40 uppercase tracking-wider">{t("weeklyPerformance")}</span>
                          <div className="flex gap-1.5">
                            {data.weekDates.map((dateStr, i) => {
                              const isPast = dateStr < data.today;
                              const completed = habit.weeklyLogs?.[dateStr];
                              const dayNames = t("weekdaysShort").split(",");

                              let bgClass = "bg-black/[0.04]";
                              let textClass = "text-theme-text/30";
                              let tooltipText = `${dayNames[i]}: ${t("notDone")}`;

                              if (completed) {
                                bgClass = "bg-theme-accent";
                                textClass = "text-white";
                                tooltipText = `${dayNames[i]}: ${t("completedText")} 🎉`;
                              } else if (isPast) {
                                bgClass = "bg-black/[0.12]";
                                textClass = "text-theme-text/50";
                              }

                              return (
                                <div
                                  key={dateStr}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-extrabold transition-all duration-200 hover:scale-105 select-none shadow-sm border border-black/[0.03] ${bgClass} ${textClass}`}
                                  title={tooltipText}
                                >
                                  {dayNames[i]}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <CarrotPlanting hasInProgress={(data.tasks || []).some((t) => t.status === "in_progress")} />
          <TaskBoard
            tasks={data.tasks || []}
            onRefresh={onRefresh}
            weekStart={data.weekDates?.[0]}
            weekEnd={data.weekDates?.[6]}
          />
        </div>
      )}
    </section>
  );
}
