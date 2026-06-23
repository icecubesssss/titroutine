import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/lib/analytics";
import { HeatmapCalendar } from "@/components/analytics/HeatmapCalendar";
import { ArrowLeft, Target, Flame, Trophy } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const data = await getAnalyticsData();

  if (!data) {
    redirect(`/${locale}/login`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 text-stone-800 max-w-md mx-auto shadow-2xl overflow-y-auto relative">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b-2 border-stone-100 px-6 py-4 flex items-center justify-between">
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

      <div className="p-6 space-y-6">
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-orange-100 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-3xl font-black text-orange-600">{data.currentStreak}</div>
            <div className="text-xs font-bold text-orange-400 uppercase mt-1">Chuỗi hiện tại</div>
          </div>
          
          <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-yellow-100 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-3xl font-black text-yellow-600">{data.bestStreak}</div>
            <div className="text-xs font-bold text-yellow-400 uppercase mt-1">Chuỗi tốt nhất</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-400 uppercase">Tổng thói quen đã xong</div>
              <div className="text-2xl font-black text-blue-600">{data.totalCompletedAllTime}</div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <HeatmapCalendar 
          heatmapData={data.heatmapData}
          startDate={data.startDate}
          endDate={data.endDate}
        />
        
        <div className="text-center text-sm text-stone-400 pt-8 pb-4 font-medium">
          Dữ liệu thống kê dựa trên múi giờ của bạn.
        </div>
      </div>
    </main>
  );
}
