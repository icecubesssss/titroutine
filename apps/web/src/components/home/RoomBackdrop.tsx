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
        return "from-amber-200 via-orange-150 to-rose-250";
      case "evening":
        return "from-orange-400 via-rose-300 to-indigo-900";
      case "night":
        return "from-indigo-950 via-slate-950 to-purple-950";
      case "day":
      default:
        return "from-sky-400 to-sky-150";
    }
  };

  const skyGradient = getSkyGradient();

  // Common weather/sky elements for windows
  const renderSkyWindowContent = () => (
    <>
      <div className={`absolute inset-0 bg-gradient-to-b ${skyGradient} z-0`} />
      {weather === "rain" && (
        <div className="absolute inset-0 bg-sky-950/20 z-0 room-rain-overlay opacity-50" />
      )}
      {(timeOfDay === "day" || timeOfDay === "morning") && (
        <div className="absolute top-2 left-3 w-6 h-6 rounded-full bg-amber-200/90 blur-[0.5px] shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
      )}
      {(timeOfDay === "night" || timeOfDay === "evening") && (
        <>
          <div className="absolute top-2 right-4 w-4 h-4 rounded-full bg-yellow-100/90 shadow-[0_0_6px_rgba(253,224,71,0.3)]" />
          <div className="absolute top-4 left-3 w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse" />
          <div className="absolute top-6 left-6 w-0.5 h-0.5 bg-white rounded-full opacity-80" />
        </>
      )}
    </>
  );

  return (
    <>
      {/* FLOOR PLANE (Rotated 45deg, scaled to form 2:1 isometric diamond) */}
      {roomId !== "bedroom" || !showWallpaper ? (
        <div 
          className={`absolute w-[240px] h-[240px] rounded-[4px] border-2 border-stone-800/15 shadow-xl transition-all duration-700 ${
            roomId === "bedroom" ? "bg-amber-100/80 border-amber-900/10 [background-image:linear-gradient(45deg,rgba(0,0,0,0.015)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.015)_50%,rgba(0,0,0,0.015)_75%,transparent_75%,transparent)] [background-size:24px_24px]" :
            roomId === "kitchen" ? "bg-amber-50 border-amber-900/15 [background-image:repeating-linear-gradient(0deg,rgba(0,0,0,0.02),rgba(0,0,0,0.02)_12px,transparent_12px,transparent_24px)]" :
            roomId === "living" ? "bg-amber-900/20 border-amber-955/15 [background-image:linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:16px_100%]" :
            roomId === "garden" ? "bg-gradient-to-br from-emerald-500 to-green-600 border-green-800/20" :
            "bg-gradient-to-br from-cyan-100 to-blue-200 border-cyan-300/30"
          }`}
          style={{
            transform: "rotate(45deg) scale(1, 0.5)",
            bottom: "20px",
            left: "50px",
            zIndex: 1,
          }}
        >
          {/* Extra details drawn flat on the floor */}
          {roomId === "kitchen" && (
            /* River stream running at the front-right edge of the kitchen floor */
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-sky-200/60 border-l border-sky-300/40 flex flex-col justify-around items-center text-[10px]">
              <span>🪷</span>
              <span>🍀</span>
            </div>
          )}
          {roomId === "garden" && (
            /* Garden soil path */
            <div className="absolute inset-x-8 inset-y-12 bg-amber-800/20 border border-amber-900/10 rounded-full blur-[0.5px] flex items-center justify-around text-xs">
              <span>🌱</span>
              <span>🌱</span>
            </div>
          )}
        </div>
      ) : null}

      {/* LEFT WALL PLANE (Skewed 26.565deg) */}
      {roomId !== "bedroom" || !showWallpaper ? (
        <div 
          className={`absolute w-[170px] h-[200px] origin-bottom-right transition-all duration-700 ${
            roomId === "bedroom" ? "bg-gradient-to-b from-indigo-50/70 via-purple-50/50 to-rose-50/40 border-l border-t border-purple-200/50" :
            roomId === "kitchen" ? "bg-gradient-to-b from-emerald-100/50 via-teal-50/40 to-green-100/30 border-l border-t border-emerald-300/40" :
            roomId === "living" ? "bg-gradient-to-b from-emerald-955/10 via-teal-900/5 to-transparent border-l border-t border-stone-300" :
            roomId === "garden" ? "bg-transparent border-l-2 border-dashed border-stone-300/25" :
            "bg-gradient-to-b from-cyan-50/80 via-blue-50/60 to-transparent border-l border-t border-cyan-200"
          }`}
          style={{
            transform: "skewY(26.565deg)",
            bottom: "190px",
            right: "50%",
            zIndex: 2,
          }}
        >
          {/* Bamboo textures for kitchen wall */}
          {roomId === "kitchen" && (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.1)_2px,transparent_2px)] bg-[size:16px_100%]" />
          )}
          {/* Mosaic tiles for bathroom wall */}
          {roomId === "bathroom" && (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,180,216,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(0,180,216,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
          )}

          {/* Windows and Wall Hanging items (Auto-skewed with the parent wall!) */}
          {roomId === "bedroom" && (
            /* Arch Window */
            <div className="absolute top-[18%] left-[20%] w-16 h-22 border-2 border-white bg-white/40 rounded-t-full shadow-sm overflow-hidden flex flex-col justify-between">
              {renderSkyWindowContent()}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/70" />
            </div>
          )}

          {roomId === "kitchen" && (
            /* Round Window in the kitchen */
            <div className="absolute top-[20%] left-[24%] w-16 h-16 border-2 border-white bg-white/40 rounded-full shadow-sm overflow-hidden relative">
              {renderSkyWindowContent()}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/60" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/60" />
            </div>
          )}

          {roomId === "living" && (
            /* Cute photo frame */
            <div className="absolute top-[24%] left-[25%] w-10 h-12 border-2 border-amber-800 bg-amber-50 shadow p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-emerald-100/50 flex items-center justify-center text-[10px]">
                🖼️
              </div>
            </div>
          )}

          {roomId === "garden" && (
            /* Open picket fence along the skewed boundary */
            <div className="absolute bottom-0 inset-x-0 h-10 flex justify-around items-end">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-2.5 h-8 bg-white border border-stone-250 rounded-t-sm shadow-sm" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)" }} />
              ))}
              <div className="absolute bottom-1.5 inset-x-0 h-1 bg-white border border-stone-200" />
            </div>
          )}

          {roomId === "bathroom" && (
            /* Hanging towel */
            <div className="absolute top-[18%] left-[24%] w-6 h-16 flex flex-col items-center">
              <div className="w-4 h-1 bg-stone-300 rounded-full" />
              <div className="w-3.5 h-12 bg-cyan-100 border border-cyan-200 rounded-b shadow-sm" />
            </div>
          )}
        </div>
      ) : null}

      {/* RIGHT WALL PLANE (Skewed -26.565deg) */}
      {roomId !== "bedroom" || !showWallpaper ? (
        <div 
          className={`absolute w-[170px] h-[200px] origin-bottom-left transition-all duration-700 ${
            roomId === "bedroom" ? "bg-gradient-to-b from-indigo-50/60 via-purple-50/40 to-rose-50/30 border-r border-t border-purple-250/40" :
            roomId === "kitchen" ? "bg-gradient-to-b from-emerald-100/40 via-teal-50/30 to-green-100/20 border-r border-t border-emerald-300/30" :
            roomId === "living" ? "bg-gradient-to-b from-emerald-955/15 via-teal-900/10 to-transparent border-r border-t border-stone-300" :
            roomId === "garden" ? "bg-transparent border-r-2 border-dashed border-stone-300/25" :
            "bg-gradient-to-b from-cyan-50/70 via-blue-50/50 to-transparent border-r border-t border-cyan-200"
          }`}
          style={{
            transform: "skewY(-26.565deg)",
            bottom: "190px",
            left: "50%",
            zIndex: 2,
          }}
        >
          {/* Bamboo textures for kitchen wall */}
          {roomId === "kitchen" && (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.1)_2px,transparent_2px)] bg-[size:16px_100%]" />
          )}
          {/* Mosaic tiles for bathroom wall */}
          {roomId === "bathroom" && (
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,180,216,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(0,180,216,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
          )}

          {/* Windows, Bookshelves, and Wall decorations (Auto-skewed with the parent wall!) */}
          {roomId === "bedroom" && (
            /* Bed wall poster */
            <div className="absolute top-[22%] right-[25%] w-8 h-10 bg-rose-100/80 border border-rose-200 shadow-sm p-0.5 flex items-center justify-center rotate-[-1deg]">
              <span className="text-[10px]">🌸</span>
            </div>
          )}

          {roomId === "kitchen" && (
            /* Cozy kitchen shelf */
            <div className="absolute top-[28%] right-[20%] w-20 h-10 flex flex-col justify-end">
              <div className="flex gap-2 justify-center text-xs opacity-95">🏺☕🪴</div>
              <div className="w-full h-1 bg-amber-800 rounded-full shadow-sm" />
            </div>
          )}

          {roomId === "living" && (
            /* Wall shelf with books and vase */
            <div className="absolute top-[30%] right-[15%] w-24 h-24 bg-amber-900/10 border-l border-stone-300/40 p-1 flex flex-col justify-around">
              <div className="h-0.5 bg-stone-350 w-full" />
              <div className="flex justify-around text-[10px]">📚🏺</div>
              <div className="h-0.5 bg-stone-350 w-full" />
            </div>
          )}

          {roomId === "garden" && (
            /* Open picket fence along the right skewed boundary */
            <div className="absolute bottom-0 inset-x-0 h-10 flex justify-around items-end">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-2.5 h-8 bg-white border border-stone-250 rounded-t-sm shadow-sm" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 100%, 0% 100%, 0% 25%)" }} />
              ))}
              <div className="absolute bottom-1.5 inset-x-0 h-1 bg-white border border-stone-200" />
            </div>
          )}

          {roomId === "bathroom" && (
            /* Arched Bathroom Mirror */
            <div className="absolute top-[18%] right-[24%] w-12 h-16 border-2 border-stone-250 bg-sky-50/60 rounded-t-full shadow overflow-hidden flex items-center justify-center">
              <div className="absolute top-1 right-1 w-8 h-1 bg-white/25 rotate-[-45deg] skew-x-12" />
              <span className="text-[10px] filter opacity-45">🫧</span>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
