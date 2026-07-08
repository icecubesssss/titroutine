import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/lib/analytics";
import { HeatmapCalendar } from "@/components/analytics/HeatmapCalendar";
import { MoodCalendar } from "@/components/analytics/MoodCalendar";
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

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 text-stone-800 w-full overflow-y-auto relative pb-12">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b-2 border-stone-100 px-6 py-4">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${locale}`}
              className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </Link>
            <h1 className="text-xl font-black tracking-tight text-stone-800">Thống Kê</h1>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 py-6 space-y-6">
        
        {/* Habit Statistics Section */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            Thói quen &amp; Điểm danh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-orange-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">Chuỗi hiện tại</div>
                <div className="text-3xl font-black text-orange-600 mt-0.5">{data.currentStreak} ngày</div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-yellow-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">Chuỗi tốt nhất</div>
                <div className="text-3xl font-black text-yellow-600 mt-0.5">{data.bestStreak} ngày</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-blue-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">Tổng thói quen xong</div>
                <div className="text-3xl font-black text-blue-600 mt-0.5">{data.totalCompletedAllTime} lần</div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Focus Statistics Section */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            Tập trung &amp; Công việc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-purple-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">Thời gian tập trung</div>
                <div className="text-3xl font-black text-purple-600 mt-0.5">{data.totalFocusMinutes} phút</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">Công việc đã xong</div>
                <div className="text-3xl font-black text-emerald-600 mt-0.5">{data.totalTasksCompleted} nhiệm vụ</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-amber-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-400 uppercase">Công việc đang chờ</div>
                <div className="text-3xl font-black text-amber-600 mt-0.5">{data.pendingTasksCount} nhiệm vụ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            Lịch sử hoạt động (60 ngày qua)
          </h2>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <HeatmapCalendar
              heatmapData={data.heatmapData}
              startDate={data.startDate}
              endDate={data.endDate}
            />
          </div>
        </div>

        {/* Mood Journal Calendar (Habit-Rabbit style month view) */}
        <div>
          <h2 className="text-sm font-black text-stone-400 uppercase tracking-wider mb-3">
            Nhật ký cảm xúc
          </h2>
          <MoodCalendar moodLogs={data.moodLogs} today={data.endDate} />
        </div>
        
        <div className="text-center text-sm text-stone-400 pt-8 pb-4 font-medium">
          Dữ liệu thống kê dựa trên múi giờ của bạn.
        </div>
      </div>
    </main>
  );
}
