"use client";

import React from "react";

interface HeatmapCalendarProps {
  heatmapData: Record<string, number>;
  startDate: string;
  endDate: string;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  heatmapData,
  startDate,
  endDate,
}) => {
  const days: { date: string; count: number }[] = [];
  
  // Generate array of days from startDate to endDate
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      count: heatmapData[dateStr] || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // Calculate color based on count
  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-100 border-gray-200";
    if (count === 1) return "bg-green-200 border-green-300";
    if (count === 2) return "bg-green-400 border-green-500";
    return "bg-green-600 border-green-700";
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span>📅</span> Lịch sử 60 ngày qua
      </h3>
      
      {/* We use a simple wrap flex container so it flows nicely on mobile */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {days.map((day) => {
          const count = day.count;
          const dateObj = new Date(`${day.date}T00:00:00Z`);
          const tooltip = `${dateObj.toLocaleDateString("vi-VN")}: ${count} habits`;
          
          return (
            <div
              key={day.date}
              title={tooltip}
              className={`w-5 h-5 rounded-sm border ${getColor(count)} transition-all hover:scale-125 cursor-pointer hover:shadow-md`}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center justify-end gap-2 text-xs font-medium text-gray-400">
        <span>Ít</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
          <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-300"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400 border border-green-500"></div>
          <div className="w-3 h-3 rounded-sm bg-green-600 border border-green-700"></div>
        </div>
        <span>Nhiều</span>
      </div>
    </div>
  );
};
