"use client";

import React from "react";
import type { RoomId } from "@/lib/rooms";
import type { TimeOfDay } from "@/components/home/hooks/useTimeOfDay";

interface RoomBackdropProps {
  roomId: RoomId;
  timeOfDay: TimeOfDay;
  weather: "rain" | "snow" | null;
  showWallpaper: boolean;
}

export function RoomBackdrop({ roomId, timeOfDay, weather, showWallpaper }: RoomBackdropProps) {
  // Sky colors inside window based on time of day
  const getSkyGradient = () => {
    switch (timeOfDay) {
      case "morning":
        return "from-amber-200 via-orange-100 to-rose-200";
      case "evening":
        return "from-orange-400 via-rose-300 to-indigo-850";
      case "night":
        return "from-indigo-950 via-slate-900 to-purple-950";
      case "day":
      default:
        return "from-sky-300 to-sky-100";
    }
  };

  const skyGradient = getSkyGradient();

  switch (roomId) {
    case "bedroom":
      if (showWallpaper) return null; // Let the equipped wallpaper shine
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
          {/* Wall texture - warm cream paneling */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-purple-50/30 to-rose-50/20" />
          <div className="absolute inset-x-0 top-0 bottom-44 border-b border-stone-200/40 bg-[linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:48px_100%]" />

          {/* Arched Window in the center */}
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-32 h-44 border-4 border-white bg-white rounded-t-full shadow-md overflow-hidden flex flex-col justify-between z-0">
            {/* Sky Background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${skyGradient} z-0`} />

            {/* Rain Inside Window */}
            {weather === "rain" && (
              <div className="absolute inset-0 bg-sky-950/20 z-0 room-rain-overlay opacity-40" />
            )}

            {/* Sun or Moon */}
            {(timeOfDay === "day" || timeOfDay === "morning") && (
              <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-amber-200/90 blur-[1px] shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
            )}
            {(timeOfDay === "night" || timeOfDay === "evening") && (
              <>
                <div className="absolute top-4 right-6 w-6 h-6 rounded-full bg-yellow-100/90 shadow-[0_0_8px_rgba(253,224,71,0.4)]" />
                {/* Twinkling stars */}
                <div className="absolute top-8 left-4 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" />
                <div className="absolute top-12 left-10 w-0.5 h-0.5 bg-white rounded-full opacity-80" />
                <div className="absolute top-6 left-16 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" />
              </>
            )}

            {/* Window windowpane bars */}
            <div className="absolute inset-0 flex justify-center z-10">
              <div className="w-1 h-full bg-white/70" />
            </div>
            <div className="absolute inset-y-1/2 inset-x-0 h-1 bg-white/70 z-10" />

            {/* Clouds inside window */}
            {timeOfDay === "day" && (
              <div className="absolute top-10 left-[-10px] w-12 h-4 bg-white/75 rounded-full blur-[0.5px] opacity-80 animate-pulse" style={{ animationDuration: "8s" }} />
            )}
          </div>

          {/* Curtains on both sides of the window */}
          <div className="absolute top-[10%] left-[calc(50%-74px)] w-8 h-44 bg-rose-200/80 rounded-b-xl shadow-sm z-10 backdrop-blur-[0.5px] border-r border-rose-300/20" />
          <div className="absolute top-[10%] left-[calc(50%+42px)] w-8 h-44 bg-rose-200/80 rounded-b-xl shadow-sm z-10 backdrop-blur-[0.5px] border-l border-rose-300/20" />
          {/* Curtain rod */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-40 h-2 bg-amber-800/85 rounded-full z-20" />

          {/* Cozy Nightstand on the left */}
          <div className="absolute bottom-44 left-[10%] w-16 h-16 flex flex-col justify-end z-10">
            {/* Lamp on nightstand */}
            <div className="w-8 h-8 mx-auto relative flex flex-col justify-end">
              <div className={`w-6 h-5 mx-auto rounded-t-xl bg-amber-100 border border-amber-200 shadow-sm ${timeOfDay === "night" ? "shadow-[0_0_12px_rgba(253,224,71,0.5)] bg-yellow-200" : ""}`} />
              <div className="w-1.5 h-3 mx-auto bg-stone-400" />
            </div>
            {/* Nightstand body */}
            <div className="w-full h-10 bg-amber-700/90 rounded-t-md border-t border-amber-600 shadow-sm flex flex-col justify-around p-1">
              <div className="w-2 h-2 rounded-full bg-amber-900 mx-auto" />
            </div>
          </div>

          {/* Cozy Bed Headboard on the right */}
          <div className="absolute bottom-44 right-[-10px] w-28 h-20 bg-amber-850/90 rounded-l-2xl border-l-4 border-amber-900 shadow-lg z-0 flex flex-col justify-start items-start p-2">
            {/* White Pillow silhouette */}
            <div className="w-16 h-8 bg-stone-100 rounded-lg shadow-sm border border-stone-200 -mt-4 ml-2 rotate-[-5deg]" />
          </div>
        </div>
      );

    case "kitchen":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
          {/* Wall tiles texture */}
          <div className="absolute inset-0 kitchen-tiles-wall" />

          {/* Kitchen Window */}
          <div className="absolute top-[15%] right-[15%] w-24 h-24 border-4 border-stone-300/90 bg-white shadow-sm overflow-hidden flex flex-col justify-between z-0">
            <div className={`absolute inset-0 bg-gradient-to-b ${skyGradient} z-0`} />

            {/* Rain Inside Window */}
            {weather === "rain" && (
              <div className="absolute inset-0 bg-sky-950/20 z-0 room-rain-overlay opacity-40" />
            )}
            <div className="absolute inset-0 flex justify-center z-10"><div className="w-0.5 h-full bg-stone-350" /></div>
            <div className="absolute inset-y-1/2 inset-x-0 h-0.5 bg-stone-350 z-10" />
            {/* Sun or Moon */}
            {(timeOfDay === "day" || timeOfDay === "morning") && (
              <div className="absolute top-2 left-4 w-5 h-5 rounded-full bg-amber-200/90" />
            )}
          </div>

          {/* Wall Hanging Kitchen Shelf */}
          <div className="absolute top-[22%] left-[12%] w-44 h-16 z-10 flex flex-col justify-between">
            {/* Shelf Items (Cups, Spice jars, Small plant) */}
            <div className="flex gap-4 px-3 items-end justify-start h-12">
              <span className="text-xl select-none filter drop-shadow-sm">🪴</span>
              <span className="text-lg select-none filter drop-shadow-sm">☕</span>
              <span className="text-base select-none filter drop-shadow-sm">🧂</span>
            </div>
            {/* Wooden shelf board */}
            <div className="w-full h-2 bg-amber-800/90 rounded-full shadow-sm" />
            {/* Shelf supports */}
            <div className="flex justify-between px-6">
              <div className="w-1.5 h-3 bg-amber-900/80" />
              <div className="w-1.5 h-3 bg-amber-900/80" />
            </div>
          </div>

          {/* Kitchen Countertop (cabinet) at the floor line */}
          <div className="absolute bottom-44 left-0 right-0 h-10 bg-amber-900/10 border-b-4 border-amber-800/25 flex items-end justify-between px-6 z-0">
            {/* Small countertop shelf outlines */}
            <div className="w-24 h-8 bg-stone-100/90 rounded-t border-t border-x border-stone-200/50 shadow-sm flex items-center justify-center">
              <span className="text-[10px] text-stone-400 font-bold">COOKER</span>
            </div>
            <div className="w-16 h-8 bg-stone-200/80 rounded-t border-t border-x border-stone-300/40 shadow-sm flex items-center justify-center">
              <span className="text-sm select-none">🍯</span>
            </div>
          </div>
        </div>
      );

    case "living":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Wall paper */}
          <div className="absolute inset-0 living-striped-wall" />

          {/* Wall hanging photo frame */}
          <div className="absolute top-[16%] left-[15%] w-14 h-18 border-4 border-amber-800 bg-amber-50 shadow-md flex items-center justify-center p-1 z-10 rotate-[2deg]">
            <div className="w-full h-full bg-emerald-100 border border-emerald-250 flex items-center justify-center">
              <span className="text-xs select-none">🖼️</span>
            </div>
          </div>

          {/* Wall bookshelf in the right corner */}
          <div className="absolute top-[25%] right-0 w-24 h-48 bg-amber-850/80 rounded-l-xl border-l-4 border-amber-900 shadow-md p-2 flex flex-col justify-between z-0">
            <div className="h-1 bg-amber-900/60 w-full" />
            <div className="flex justify-around text-xs select-none opacity-80">📚</div>
            <div className="h-1 bg-amber-900/60 w-full" />
            <div className="flex justify-around text-xs select-none opacity-80">🏺</div>
            <div className="h-1 bg-amber-900/60 w-full" />
          </div>
        </div>
      );

    case "garden":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex flex-col justify-between">
          {/* Dynamic Sky backdrop */}
          <div className={`absolute inset-0 bg-gradient-to-b ${skyGradient} z-0`} />

          {/* Rain Overlay */}
          {weather === "rain" && (
            <div className="absolute inset-0 bg-sky-950/10 z-0 room-rain-overlay opacity-30" />
          )}

          {/* Sun or Moon */}
          {(timeOfDay === "day" || timeOfDay === "morning") && (
            <div className="absolute top-10 left-12 w-12 h-12 rounded-full bg-amber-200/90 blur-[1px] shadow-[0_0_16px_rgba(251,191,36,0.4)]" />
          )}
          {(timeOfDay === "night" || timeOfDay === "evening") && (
            <div className="absolute top-10 right-12 w-10 h-10 rounded-full bg-yellow-100/90 shadow-[0_0_12px_rgba(253,224,71,0.35)]" />
          )}

          {/* Clouds */}
          {timeOfDay === "day" && (
            <>
              <div className="absolute top-16 left-[20%] w-24 h-6 bg-white/70 rounded-full blur-[1px] animate-pulse" style={{ animationDuration: "12s" }} />
              <div className="absolute top-24 right-[15%] w-32 h-8 bg-white/60 rounded-full blur-[1.5px] animate-pulse" style={{ animationDuration: "16s" }} />
            </>
          )}

          {/* Background hills */}
          <div className="absolute bottom-44 left-0 right-0 h-28 bg-gradient-to-t from-emerald-200/80 to-emerald-100/50 rounded-t-[50%] scale-x-125 z-0 translate-y-6" />
          <div className="absolute bottom-44 left-[-10%] right-[-10%] h-20 bg-gradient-to-t from-lime-200/90 to-lime-100/60 rounded-t-[40%] z-0 translate-y-2" />

          {/* Cozy White picket fence */}
          <div className="absolute bottom-44 left-0 right-0 h-12 z-10 flex justify-around items-end opacity-85 px-4">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-2.5 h-8 bg-white border border-stone-200 rounded-t-sm shadow-sm" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)" }} />
              </div>
            ))}
            {/* Crossbar */}
            <div className="absolute bottom-2 left-0 right-0 h-1.5 bg-white border border-stone-200 shadow-sm" />
          </div>
        </div>
      );

    case "bathroom":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Mosaic wall */}
          <div className="absolute inset-0 bathroom-mosaic-wall" />

          {/* Hanging towel */}
          <div className="absolute top-[20%] left-[10%] w-8 h-24 flex flex-col items-center z-10">
            <div className="w-6 h-2 bg-stone-350 rounded-full" />
            <div className="w-5 h-20 bg-cyan-100 border-x border-b border-cyan-200 rounded-b-md shadow-sm" />
          </div>

          {/* Arched Mirror on the wall */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-28 h-32 border-4 border-stone-250 bg-sky-50/70 rounded-t-full shadow-md overflow-hidden flex items-center justify-center z-0">
            <div className="absolute top-2 right-2 w-20 h-4 bg-white/20 rotate-[-45deg] skew-x-12" />
            <span className="text-xl select-none filter opacity-45">🧼</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
