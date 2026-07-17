"use client";

import React from "react";
import type { RoomId } from "@/lib/rooms";
import type { TimeOfDay } from "@/components/home/hooks/useTimeOfDay";

interface RoomBackdropProps {
  roomId: RoomId;
  timeOfDay: TimeOfDay;
  weather: "rain" | "snow" | null;
  showWallpaper: boolean;
  customWallpaper?: { imageUrl: string } | null;
}

export function RoomBackdrop({ roomId, timeOfDay, weather, showWallpaper, customWallpaper }: RoomBackdropProps) {
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
      {/* Self-contained UI Masterpiece Animations */}
      <style>{`
        @keyframes floatFirefly {
          0% { transform: translateY(100px) translateX(0); opacity: 0; }
          40% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-30px) translateX(15px); opacity: 0; }
        }
        @keyframes floatBubble {
          0% { transform: translateY(110%) scale(0.6); opacity: 0; }
          20% { opacity: 0.7; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-20px) scale(1.1) translateX(10px); opacity: 0; }
        }
        .firefly {
          position: absolute;
          width: 4px;
          height: 4px;
          background-color: #fbbf24;
          border-radius: 50%;
          box-shadow: 0 0 6px #f59e0b, 0 0 12px #fbbf24;
          opacity: 0;
          pointer-events: none;
        }
        .firefly-0 { left: 15%; bottom: 10%; animation: floatFirefly 5s infinite ease-in-out; }
        .firefly-1 { left: 35%; bottom: 20%; animation: floatFirefly 7s infinite ease-in-out 1s; }
        .firefly-2 { left: 55%; bottom: 15%; animation: floatFirefly 6s infinite ease-in-out 2s; }
        .firefly-3 { left: 75%; bottom: 25%; animation: floatFirefly 8s infinite ease-in-out 1.5s; }
        .firefly-4 { left: 45%; bottom: 5%; animation: floatFirefly 5.5s infinite ease-in-out 3s; }
        .firefly-5 { left: 85%; bottom: 12%; animation: floatFirefly 6.5s infinite ease-in-out 0.5s; }

        .bubble-particle {
          position: absolute;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(6,182,212,0.15));
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          box-shadow: inset 0 0 4px rgba(255,255,255,0.2);
        }
        .bubble-0 { left: 20%; bottom: 10%; width: 10px; height: 10px; animation: floatBubble 4.5s infinite linear; }
        .bubble-1 { left: 40%; bottom: 15%; width: 13px; height: 13px; animation: floatBubble 6s infinite linear 1.2s; }
        .bubble-2 { left: 60%; bottom: 5%; width: 8px; height: 8px; animation: floatBubble 5s infinite linear 2.5s; }
        .bubble-3 { left: 80%; bottom: 12%; width: 11px; height: 11px; animation: floatBubble 7s infinite linear 0.4s; }
        .bubble-4 { left: 30%; bottom: 8%; width: 9px; height: 9px; animation: floatBubble 5.5s infinite linear 1.8s; }
        .bubble-5 { left: 70%; bottom: 20%; width: 12px; height: 12px; animation: floatBubble 6.5s infinite linear 0.8s; }
      `}</style>

      {/* 3D PLATFORM DIORAMA BASE (Vector-sharp SVG) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 1 }}
        viewBox="0 0 340 340"
      >
        <defs>
          {/* Wood patterns & gradients */}
          <linearGradient id="woodTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id="woodLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="woodRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          {/* Living room parquet oak */}
          <linearGradient id="parquetTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.9" />
          </linearGradient>

          {/* Garden soil & grass layers */}
          <linearGradient id="grassTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="soilLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="40%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
          <linearGradient id="soilRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="40%" stopColor="#5c1f06" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>

          {/* Bathroom marble tile */}
          <linearGradient id="tileTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f7fa" />
            <stop offset="100%" stopColor="#b2ebf2" />
          </linearGradient>
          <linearGradient id="tileLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00838f" />
            <stop offset="100%" stopColor="#006064" />
          </linearGradient>
          <linearGradient id="tileRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00acc1" />
            <stop offset="100%" stopColor="#00838f" />
          </linearGradient>

          {/* Animated Water flow pattern */}
          <pattern id="waterFlow" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="40" height="40" fill="#7dd3fc" fillOpacity="0.8" />
            <path d="M 0 10 Q 10 5, 20 10 T 40 10" fill="none" stroke="#e0f2fe" strokeWidth="2.5" />
            <path d="M 0 30 Q 10 25, 20 30 T 40 30" fill="none" stroke="#e0f2fe" strokeWidth="2.5" />
            <animateTransform 
              attributeName="patternTransform" 
              type="translate" 
              from="0,0" to="-40,0" 
              dur="2.5s" 
              repeatCount="indefinite" 
            />
          </pattern>
        </defs>

        {/* 3D Platform Thickness Sides */}
        {/* Left Side Face */}
        <polygon 
          points="50,260 170,320 170,334 50,274" 
          fill={
            roomId === "garden" ? "url(#soilLeft)" :
            roomId === "bathroom" ? "url(#tileLeft)" :
            roomId === "kitchen" ? "#064e3b" :
            "url(#woodLeft)"
          }
        />
        {/* Right Side Face */}
        <polygon 
          points="170,320 290,260 290,272 170,332" 
          fill={
            roomId === "garden" ? "url(#soilRight)" :
            roomId === "bathroom" ? "url(#tileRight)" :
            roomId === "kitchen" ? "#065f46" :
            "url(#woodRight)"
          }
        />

        {/* Top Face (Floor diamond) */}
        <polygon 
          points="170,200 290,260 170,320 50,260" 
          fill={
            roomId === "bedroom" ? "url(#woodTop)" :
            roomId === "kitchen" ? "#fef8e7" : // Japanese tatami base
            roomId === "living" ? "url(#parquetTop)" :
            roomId === "garden" ? "url(#grassTop)" :
            "url(#tileTop)"
          }
          stroke={roomId === "garden" ? "#047857" : "#78350f"}
          strokeWidth="1.5"
          strokeOpacity="0.2"
        />

        {/* Flat patterns overlay */}
        {roomId === "bedroom" && (
          /* Cozy Bedroom Wood Seams */
          <>
            <line x1="80" y1="245" x2="200" y2="305" stroke="#92400e" strokeWidth="0.8" strokeOpacity="0.15" />
            <line x1="110" y1="230" x2="230" y2="290" stroke="#92400e" strokeWidth="0.8" strokeOpacity="0.15" />
            <line x1="140" y1="215" x2="260" y2="275" stroke="#92400e" strokeWidth="0.8" strokeOpacity="0.15" />
          </>
        )}

        {/* Kitchen Tatami Mats & Animated Water Stream */}
        {roomId === "kitchen" && (
          <>
            {/* Tatami borders */}
            <polygon points="170,200 230,230 170,260 110,230" fill="none" stroke="#b45309" strokeWidth="1" strokeOpacity="0.1" />
            <polygon points="110,230 170,260 110,290 50,260" fill="none" stroke="#b45309" strokeWidth="1" strokeOpacity="0.1" />
            {/* Animated Stream at the front-right edge */}
            <polygon points="230,230 290,260 170,320 110,290" fill="url(#waterFlow)" />
            {/* Stream details */}
            <text x="235" y="270" style={{ fontSize: "12px", userSelect: "none" }}>🪷</text>
            <text x="175" y="305" style={{ fontSize: "12px", userSelect: "none" }}>🍀</text>
          </>
        )}

        {/* Living Room Wooden Grid */}
        {roomId === "living" && (
          <>
            <line x1="170" y1="200" x2="170" y2="320" stroke="#451a03" strokeWidth="0.8" strokeOpacity="0.3" />
            <line x1="110" y1="230" x2="230" y2="290" stroke="#451a03" strokeWidth="0.8" strokeOpacity="0.3" />
            <line x1="50" y1="260" x2="290" y2="260" stroke="#451a03" strokeWidth="0.8" strokeOpacity="0.3" />
          </>
        )}

        {/* Garden Soil Beds */}
        {roomId === "garden" && (
          <>
            {/* Round path */}
            <ellipse cx="170" cy="260" rx="60" ry="25" fill="#78350f" fillOpacity="0.18" />
            <text x="150" y="260" style={{ fontSize: "14px" }}>🌱</text>
            <text x="180" y="265" style={{ fontSize: "14px" }}>🌱</text>
          </>
        )}

        {/* Bathroom Mosaic Grid */}
        {roomId === "bathroom" && (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const xVal = 50 + i * 40;
              return (
                <line 
                  key={`tile-v-${i}`} 
                  x1={xVal} y1={260 - (i - 3.5) * 20} 
                  x2={xVal + 60} y2={290 - (i - 3.5) * 20} 
                  stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" 
                />
              );
            })}
          </>
        )}
      </svg>

      {/* LEFT WALL PLANE (Skewed 26.565deg) */}
      <div 
        className={`absolute w-[170px] h-[200px] origin-bottom-right transition-all duration-700 ${
          roomId === "bedroom" ? "bg-gradient-to-b from-indigo-50/70 via-purple-50/50 to-rose-50/40 border-l border-t border-purple-200/50" :
          roomId === "kitchen" ? "bg-gradient-to-b from-emerald-100/50 via-teal-50/40 to-green-100/30 border-l border-t border-emerald-300/40" :
          roomId === "living" ? "bg-gradient-to-b from-emerald-955/10 via-teal-900/5 to-transparent border-l border-t border-stone-300" :
          roomId === "garden" ? "bg-transparent border-l border-dashed border-stone-300/25" :
          "bg-gradient-to-b from-cyan-50/80 via-blue-50/60 to-transparent border-l border-t border-cyan-200"
        }`}
        style={{
          transform: "skewY(26.565deg)",
          bottom: "190px",
          right: "50%",
          zIndex: 2,
          ...(showWallpaper && customWallpaper ? {
            backgroundImage: `url(${customWallpaper.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.92)" // Slightly darker left wall for realistic ambient light
          } : {})
        }}
      >
        {/* Environment Animations Overlay */}
        {roomId === "garden" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="firefly firefly-0" />
            <span className="firefly firefly-1" />
            <span className="firefly firefly-2" />
          </div>
        )}

        {roomId === "bathroom" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="bubble-particle bubble-0" />
            <span className="bubble-particle bubble-1" />
            <span className="bubble-particle bubble-2" />
          </div>
        )}

        {/* Bamboo textures for kitchen wall */}
        {roomId === "kitchen" && !customWallpaper && (
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.15)_2px,transparent_2px)] bg-[size:16px_100%]" />
        )}
        {/* Mosaic tiles for bathroom wall */}
        {roomId === "bathroom" && !customWallpaper && (
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,180,216,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(0,180,216,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
        )}

        {/* Windows and Wall Hanging items */}
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

      {/* RIGHT WALL PLANE (Skewed -26.565deg) */}
      <div 
        className={`absolute w-[170px] h-[200px] origin-bottom-left transition-all duration-700 ${
          roomId === "bedroom" ? "bg-gradient-to-b from-indigo-50/60 via-purple-50/40 to-rose-50/30 border-r border-t border-purple-250/40" :
          roomId === "kitchen" ? "bg-gradient-to-b from-emerald-100/40 via-teal-50/30 to-green-100/20 border-r border-t border-emerald-300/30" :
          roomId === "living" ? "bg-gradient-to-b from-emerald-955/15 via-teal-900/10 to-transparent border-r border-t border-stone-300" :
          roomId === "garden" ? "bg-transparent border-r border-dashed border-stone-300/25" :
          "bg-gradient-to-b from-cyan-50/70 via-blue-50/50 to-transparent border-r border-t border-cyan-200"
        }`}
        style={{
          transform: "skewY(-26.565deg)",
          bottom: "190px",
          left: "50%",
          zIndex: 2,
          ...(showWallpaper && customWallpaper ? {
            backgroundImage: `url(${customWallpaper.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : {})
        }}
      >
        {/* Environment Animations Overlay */}
        {roomId === "garden" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="firefly firefly-3" />
            <span className="firefly firefly-4" />
            <span className="firefly firefly-5" />
          </div>
        )}

        {roomId === "bathroom" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="bubble-particle bubble-3" />
            <span className="bubble-particle bubble-4" />
            <span className="bubble-particle bubble-5" />
          </div>
        )}

        {/* Bamboo textures for kitchen wall */}
        {roomId === "kitchen" && !customWallpaper && (
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.15)_2px,transparent_2px)] bg-[size:16px_100%]" />
        )}
        {/* Mosaic tiles for bathroom wall */}
        {roomId === "bathroom" && !customWallpaper && (
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,180,216,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(0,180,216,0.08)_1px,transparent_1px)] bg-[size:12px_12px]" />
        )}

        {/* Windows, Bookshelves, and Wall decorations */}
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
    </>
  );
}
