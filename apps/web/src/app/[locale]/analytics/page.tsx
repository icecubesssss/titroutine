import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAnalyticsData } from "@/lib/analytics";
import { HeatmapCalendar } from "@/components/analytics/HeatmapCalendar";
import { MoodCalendar } from "@/components/analytics/MoodCalendar";
import { HabitStatsTable, MoodInsights, WeekdayChart, WeekRecapCard } from "@/components/analytics/HabitInsights";
import { ArrowLeft, Target, Flame, Trophy, Clock, CheckSquare, ListTodo } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const data = await getAnalyticsData();

  if (!data) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations({ locale, namespace: "Analytics" });

  return (
    <main className="flex h-dvh flex-col bg-stone-50 text-stone-800 w-full overflow-y-auto relative pb-12">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b-2 border-stone-100 px-6 py-4">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}`}
              aria-label={t("back")}
              className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <h1 className="text-xl font-black tracking-tight text-stone-800">{t("title")}</h1>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* This week at a glance */}
        <WeekRecapCard recap={data.weekRecap} />

        {/* Habit Statistics Section */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            {t("habitsSection")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-orange-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">{t("currentStreak")}</div>
                <div className="text-3xl font-black text-orange-600 mt-0.5">{t("streakDays", { count: data.currentStreak })}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-yellow-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">{t("bestStreak")}</div>
                <div className="text-3xl font-black text-yellow-600 mt-0.5">{t("streakDays", { count: data.bestStreak })}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-blue-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">{t("totalCompleted")}</div>
                <div className="text-3xl font-black text-blue-600 mt-0.5">{t("times", { count: data.totalCompletedAllTime })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Per-habit breakdown + weekday rhythm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HabitStatsTable stats={data.habitStats} />
          <WeekdayChart rates={data.weekdayRates} />
        </div>

        {/* Mood ↔ habit correlation */}
        <MoodInsights insights={data.moodInsights} />

        {/* Task Focus Statistics Section */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            {t("focusSection")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-purple-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">{t("focusTime")}</div>
                <div className="text-3xl font-black text-purple-600 mt-0.5">{t("minutes", { count: data.totalFocusMinutes })}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">{t("tasksDone")}</div>
                <div className="text-3xl font-black text-emerald-600 mt-0.5">{t("tasks", { count: data.totalTasksCompleted })}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-amber-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">{t("tasksPending")}</div>
                <div className="text-3xl font-black text-amber-600 mt-0.5">{t("tasks", { count: data.pendingTasksCount })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            {t("activitySection")}
          </h2>
          <HeatmapCalendar
            heatmapData={data.heatmapData}
            startDate={data.startDate}
            endDate={data.endDate}
          />
        </div>

        {/* Mood Journal Calendar (Habit-Rabbit style month view) */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            {t("moodSection")}
          </h2>
          <MoodCalendar moodLogs={data.moodLogs} today={data.endDate} />
        </div>

        <div className="text-center text-sm text-stone-400 pt-8 pb-4 font-medium">
          {t("timezoneNote")}
        </div>
      </div>
    </main>
  );
}
