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

export function RoomBackdrop({ roomId, timeOfDay, showWallpaper, customWallpaper }: RoomBackdropProps) {

  // Wall base colors (when no wallpaper is equipped)
  const getLeftWallFill = () => {
    switch (roomId) {
      case "bedroom": return "url(#bedroomWallLeft)";
      case "kitchen": return "url(#kitchenWallLeft)";
      case "living": return "url(#livingWallLeft)";
      case "garden": return "none";
      case "bathroom": return "url(#bathroomWallLeft)";
      default: return "#e2e8f0";
    }
  };

  const getRightWallFill = () => {
    switch (roomId) {
      case "bedroom": return "url(#bedroomWallRight)";
      case "kitchen": return "url(#kitchenWallRight)";
      case "living": return "url(#livingWallRight)";
      case "garden": return "none";
      case "bathroom": return "url(#bathroomWallRight)";
      default: return "#cbd5e1";
    }
  };

  return (
    <>
      {/* Self-contained UI Masterpiece Animations */}
      <style>{`
        @keyframes floatFirefly {
          0% { transform: translateY(80px) translateX(0); opacity: 0; }
          40% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0; }
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

      {/* ONE UNIFIED SVG VIEWBOX (Ensures walls, windows, and floors scale with sub-pixel alignment) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 1 }}
        viewBox="0 0 340 340"
      >
        <defs>
          {/* Custom equipped wallpaper pattern */}
          {showWallpaper && customWallpaper && (
            <pattern id="customWallpaperPattern" width="1" height="1" patternContentUnits="objectBoundingBox">
              <image href={customWallpaper.imageUrl} width="1" height="1" preserveAspectRatio="none" />
            </pattern>
          )}

          {/* Wall gradients */}
          <linearGradient id="bedroomWallLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
          <linearGradient id="bedroomWallRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f3ff" />
            <stop offset="100%" stopColor="#edd8fc" />
          </linearGradient>

          <linearGradient id="kitchenWallLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
          <linearGradient id="kitchenWallRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="100%" stopColor="#dcfce7" />
          </linearGradient>

          <linearGradient id="livingWallLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f5f4" />
            <stop offset="100%" stopColor="#e7e5e4" />
          </linearGradient>
          <linearGradient id="livingWallRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fafaf9" />
            <stop offset="100%" stopColor="#f5f5f4" />
          </linearGradient>

          <linearGradient id="bathroomWallLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="100%" stopColor="#cffafe" />
          </linearGradient>
          <linearGradient id="bathroomWallRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0fdfa" />
            <stop offset="100%" stopColor="#ccfbf1" />
          </linearGradient>

          {/* Floor gradients */}
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

          <linearGradient id="parquetTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.9" />
          </linearGradient>

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

          {/* Window Sky & Weather gradients */}
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="1%">
            {timeOfDay === "morning" && (
              <>
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#fca5a5" />
              </>
            )}
            {timeOfDay === "evening" && (
              <>
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="60%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#312e81" />
              </>
            )}
            {timeOfDay === "night" && (
              <>
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#09090b" />
              </>
            )}
            {(timeOfDay === "day" || !timeOfDay) && (
              <>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#bae6fd" />
              </>
            )}
          </linearGradient>

          {/* Animated Water flow pattern */}
          <pattern id="waterFlow" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="40" height="40" fill="#7dd3fc" fillOpacity="0.85" />
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

        {/* ── 3D WALLS (Drawn inside SVG to scale with the floor block) ── */}
        {/* LEFT WALL */}
        <g transform="matrix(1, -0.5, 0, 1, 0, 135)">
          <rect 
            x="50" y="0" width="120" height="150" 
            fill={showWallpaper && customWallpaper ? "url(#customWallpaperPattern)" : getLeftWallFill()} 
            stroke={roomId === "garden" ? "none" : "#4b3621"} 
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          {/* Subtle shading overlay for Left Wall to give 3D depth */}
          <rect x="50" y="0" width="120" height="150" fill="black" fillOpacity="0.08" pointerEvents="none" />

          {/* Left Wall Decorations (Warped naturally via matrix transform!) */}
          {roomId === "bedroom" && (
            /* Arched Window */
            <>
              <path d="M 70,65 L 70,37 A 12.5,12.5 0 0,1 95,37 L 95,65 Z" fill="url(#skyGradient)" stroke="#854d0e" strokeWidth="2.5" />
              <line x1="82.5" y1="24.5" x2="82.5" y2="65" stroke="#713f12" strokeWidth="1.2" strokeOpacity="0.7" />
              <line x1="70" y1="44" x2="95" y2="44" stroke="#713f12" strokeWidth="1.2" strokeOpacity="0.7" />
              {/* Sun/Moon */}
              {timeOfDay === "night" ? (
                <circle cx="88" cy="34" r="3" fill="#fef08a" />
              ) : (
                <circle cx="78" cy="34" r="4" fill="#fef08a" />
              )}
            </>
          )}

          {roomId === "kitchen" && (
            /* Round Window */
            <>
              <circle cx="95" cy="50" r="16" fill="url(#skyGradient)" stroke="#854d0e" strokeWidth="2.5" />
              <line x1="95" y1="34" x2="95" y2="66" stroke="#713f12" strokeWidth="1.2" strokeOpacity="0.7" />
              <line x1="79" y1="50" x2="111" y2="50" stroke="#713f12" strokeWidth="1.2" strokeOpacity="0.7" />
              {/* Floating window celestial body */}
              <text x="89" y="47" style={{ fontSize: "7px", userSelect: "none" }}>
                {timeOfDay === "night" ? "🌙" : timeOfDay === "evening" ? "🌇" : timeOfDay === "morning" ? "🌅" : "☀️"}
              </text>
            </>
          )}

          {roomId === "living" && (
            /* Photo frame */
            <g>
              <rect x="75" y="40" width="22" height="26" fill="#fef8e7" stroke="#78350f" strokeWidth="2" />
              <rect x="79" y="44" width="14" height="18" fill="#d1fae5" />
              <text x="82" y="56" style={{ fontSize: "10px", userSelect: "none" }}>🖼️</text>
            </g>
          )}

          {roomId === "bathroom" && (
            /* Hanging towel */
            <g>
              <line x1="80" y1="35" x2="100" y2="35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <rect x="83" y="35" width="14" height="32" rx="1.5" fill="#e0f7fa" stroke="#b2ebf2" strokeWidth="1" />
            </g>
          )}

          {roomId === "garden" && (
            /* Garden boundary fence left */
            <g opacity="0.95">
              <polygon points="50,115 52,111 54,115 54,150 50,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <polygon points="80,115 82,111 84,115 84,150 80,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <polygon points="110,115 112,111 114,115 114,150 110,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <polygon points="140,115 142,111 144,115 144,150 140,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <rect x="50" y="128" width="120" height="4" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
            </g>
          )}
        </g>

        {/* RIGHT WALL */}
        <g transform="matrix(1, 0.5, 0, 1, 0, -35)">
          <rect 
            x="170" y="0" width="120" height="150" 
            fill={showWallpaper && customWallpaper ? "url(#customWallpaperPattern)" : getRightWallFill()} 
            stroke={roomId === "garden" ? "none" : "#4b3621"} 
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* Right Wall Decorations (Warped naturally via matrix transform!) */}
          {roomId === "bedroom" && (
            /* Cute wall poster */
            <g>
              <rect x="215" y="45" width="18" height="22" fill="#ffe4e6" stroke="#fda4af" strokeWidth="1" />
              <text x="219" y="59" style={{ fontSize: "10px", userSelect: "none" }}>🌸</text>
            </g>
          )}

          {roomId === "kitchen" && (
            /* Japanese cozy 3D shelf */
            <g>
              <polygon points="190,52 245,52 240,55 185,55" fill="#a16207" stroke="#451a03" strokeWidth="0.5" />
              <polygon points="185,55 240,55 240,57 185,57" fill="#713f12" stroke="#451a03" strokeWidth="0.5" />
              <text x="190" y="49" style={{ fontSize: "9px", userSelect: "none" }}>🏺☕🪴</text>
            </g>
          )}

          {roomId === "living" && (
            /* Double-tier 3D bookshelf */
            <g>
              {/* Shelf 1 */}
              <polygon points="190,42 245,42 240,45 185,45" fill="#a16207" stroke="#451a03" strokeWidth="0.5" />
              <polygon points="185,45 240,45 240,47 185,47" fill="#713f12" stroke="#451a03" strokeWidth="0.5" />
              <text x="190" y="39" style={{ fontSize: "8px", userSelect: "none" }}>📚🏺</text>
              {/* Shelf 2 */}
              <polygon points="190,77 245,77 240,80 185,80" fill="#a16207" stroke="#451a03" strokeWidth="0.5" />
              <polygon points="185,80 240,80 240,82 185,82" fill="#713f12" stroke="#451a03" strokeWidth="0.5" />
              <text x="195" y="74" style={{ fontSize: "8px", userSelect: "none" }}>🧸🪴</text>
            </g>
          )}

          {roomId === "bathroom" && (
            /* Bathroom Arched Mirror */
            <g>
              <path d="M 215,65 L 215,35 A 15,15 0 0,1 245,35 L 245,65 Z" fill="#e0f7fa" fillOpacity="0.5" stroke="#b2ebf2" strokeWidth="2" />
              <path d="M 218,35 Q 230,30, 242,35" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
            </g>
          )}

          {roomId === "garden" && (
            /* Garden boundary fence right */
            <g opacity="0.95">
              <polygon points="196,115 198,111 200,115 200,150 196,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <polygon points="226,115 228,111 230,115 230,150 226,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <polygon points="256,115 258,111 260,115 260,150 256,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <polygon points="286,115 288,111 290,115 290,150 286,150" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
              <rect x="170" y="128" width="120" height="4" fill="white" stroke="#cbd5e1" strokeWidth="0.5" />
            </g>
          )}
        </g>

        {/* ── 3D FLOOR PLATFORM (Thickness & Top Face) ── */}
        {/* Left Thickness Face */}
        <polygon 
          points="50,260 170,320 170,334 50,274" 
          fill={
            roomId === "garden" ? "url(#soilLeft)" :
            roomId === "bathroom" ? "url(#tileLeft)" :
            roomId === "kitchen" ? "#064e3b" :
            "url(#woodLeft)"
          }
        />
        {/* Right Thickness Face */}
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
            roomId === "kitchen" ? "#fef8e7" : // Tatami base
            roomId === "living" ? "url(#parquetTop)" :
            roomId === "garden" ? "url(#grassTop)" :
            "url(#tileTop)"
          }
          stroke={roomId === "garden" ? "#047857" : "#78350f"}
          strokeWidth="1"
          strokeOpacity="0.1"
        />

        {/* Flat patterns overlay */}
        {roomId === "bedroom" && (
          <>
            <line x1="80" y1="245" x2="200" y2="305" stroke="#92400e" strokeWidth="0.8" strokeOpacity="0.15" />
            <line x1="110" y1="230" x2="230" y2="290" stroke="#92400e" strokeWidth="0.8" strokeOpacity="0.15" />
            <line x1="140" y1="215" x2="260" y2="275" stroke="#92400e" strokeWidth="0.8" strokeOpacity="0.15" />
          </>
        )}

        {roomId === "kitchen" && (
          <>
            {/* Tatami seams */}
            <polygon points="170,200 230,230 170,260 110,230" fill="none" stroke="#b45309" strokeWidth="1" strokeOpacity="0.1" />
            <polygon points="110,230 170,260 110,290 50,260" fill="none" stroke="#b45309" strokeWidth="1" strokeOpacity="0.1" />
            {/* Animated Stream at the front-right edge */}
            <polygon points="230,230 290,260 170,320 110,290" fill="url(#waterFlow)" />
            <text x="235" y="270" style={{ fontSize: "12px", userSelect: "none" }}>🪷</text>
            <text x="175" y="305" style={{ fontSize: "12px", userSelect: "none" }}>🍀</text>
          </>
        )}

        {roomId === "living" && (
          <>
            <line x1="170" y1="200" x2="170" y2="320" stroke="#451a03" strokeWidth="0.8" strokeOpacity="0.25" />
            <line x1="110" y1="230" x2="230" y2="290" stroke="#451a03" strokeWidth="0.8" strokeOpacity="0.25" />
            <line x1="50" y1="260" x2="290" y2="260" stroke="#451a03" strokeWidth="0.8" strokeOpacity="0.25" />
          </>
        )}

        {roomId === "garden" && (
          <>
            <ellipse cx="170" cy="260" rx="60" ry="25" fill="#78350f" fillOpacity="0.18" />
            <text x="150" y="260" style={{ fontSize: "14px", userSelect: "none" }}>🌱</text>
            <text x="180" y="265" style={{ fontSize: "14px", userSelect: "none" }}>🌱</text>
          </>
        )}

        {roomId === "bathroom" && (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const xVal = 50 + i * 40;
              return (
                <line 
                  key={`tile-v-${i}`} 
                  x1={xVal} y1={260 - (i - 3.5) * 20} 
                  x2={xVal + 60} y2={290 - (i - 3.5) * 20} 
                  stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.35" 
                />
              );
            })}
          </>
        )}
      </svg>

      {/* Floating particles overlays (Bedroom/Garden/Bathroom specific) */}
      {roomId === "garden" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <span className="firefly firefly-0" />
          <span className="firefly firefly-1" />
          <span className="firefly firefly-2" />
          <span className="firefly firefly-3" />
          <span className="firefly firefly-4" />
          <span className="firefly firefly-5" />
        </div>
      )}

      {roomId === "bathroom" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <span className="bubble-particle bubble-0" />
          <span className="bubble-particle bubble-1" />
          <span className="bubble-particle bubble-2" />
          <span className="bubble-particle bubble-3" />
          <span className="bubble-particle bubble-4" />
          <span className="bubble-particle bubble-5" />
        </div>
      )}
    </>
  );
}
