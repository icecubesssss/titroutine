"use client";

import { useTranslations } from "next-intl";
import { CircleUser, Compass, Users, Palette, Heart, Lock } from "lucide-react";
import type { ActiveOverlay } from "./overlayTypes";

// Mobile "cozy toolbag" bottom sheet: quick access to pet profile, adventure,
// neighbourhood, decor mode and the mindfulness sub-menu. Neighbour + decor are
// gated (rooms fully unlocked / pet hatched); the gates are passed in as booleans.
export function QuickMenuSheet({
  open,
  setActiveOverlay,
  playSwoosh,
  adventureReady,
  roomsAllUnlocked,
  onOpenNeighbor,
  currentStage,
  isDecorMode,
  onToggleDecor,
}: {
  open: boolean;
  setActiveOverlay: (o: ActiveOverlay) => void;
  playSwoosh: () => void;
  adventureReady: boolean;
  roomsAllUnlocked: boolean;
  onOpenNeighbor: () => void;
  currentStage: number;
  isDecorMode: boolean;
  onToggleDecor: () => void;
}) {
  const t = useTranslations("Home");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade-in"
      onClick={() => setActiveOverlay(null)}
    >
      <div
        className="w-full max-w-md rounded-t-[32px] rounded-b-[24px] bg-theme-bg p-6 shadow-2xl border border-theme-card-border animate-sheet-up text-theme-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-theme-card-border pb-3.5">
          <h3 className="text-base font-black flex items-center gap-2 text-amber-900">
            🎒 Hộp Công Cụ Thỏ Cưng
          </h3>
          <button
            onClick={() => setActiveOverlay(null)}
            className="text-theme-text/45 hover:text-theme-text/80 font-bold p-1 rounded-full hover:bg-black/[0.03]"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Grid menu */}
        <div className="grid grid-cols-2 gap-3 mb-2">
          {/* Profile */}
          <button
            onClick={() => {
              playSwoosh();
              setActiveOverlay("pet_profile");
            }}
            className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center"
          >
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2 group-hover:scale-110 transition-transform">
              <CircleUser className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-amber-950">{t("profile")}</span>
            <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Thông tin thỏ cưng</span>
          </button>

          {/* Adventure */}
          <button
            onClick={() => {
              playSwoosh();
              setActiveOverlay("adventure_story");
            }}
            className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center relative"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            {adventureReady && (
              <span className="absolute top-2 right-2 text-[8px] animate-pulse">🔥 Sẵn sàng</span>
            )}
            <span className="text-xs font-black text-amber-950">{t("adventure")}</span>
            <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Đi dã ngoại kiếm quà</span>
          </button>

          {/* Neighborhood / Tree Town */}
          {roomsAllUnlocked ? (
            <button
              onClick={() => {
                playSwoosh();
                onOpenNeighbor();
              }}
              className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-650 mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-amber-950">{t("neighbor")}</span>
              <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Gặp bạn bè & gửi vibe</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 bg-black/[0.02] border border-black/[0.04] rounded-2xl opacity-60 text-center select-none relative">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-stone-500">{t("neighbor")}</span>
              <span className="text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded-full font-bold mt-1 scale-90">
                Mở khoá ở LV.10
              </span>
            </div>
          )}

          {/* Decor Mode */}
          {currentStage >= 1 ? (
            <button
              onClick={onToggleDecor}
              className={`flex flex-col items-center justify-center p-4 ${
                isDecorMode ? "bg-amber-100/50 border-amber-400" : "bg-white/70"
              } hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center`}
            >
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-amber-950">
                {isDecorMode ? t("decorDone") : t("decor")}
              </span>
              <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Sắp xếp phòng ốc</span>
            </button>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 bg-black/[0.02] border border-black/[0.04] rounded-2xl opacity-60 text-center select-none relative">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-stone-500">{t("decor")}</span>
              <span className="text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded-full font-bold mt-1 scale-90">
                Mở khoá khi thỏ tiến hoá
              </span>
            </div>
          )}
        </div>

        {/* Quick Mindfulness Toolbox Banner */}
        <button
          onClick={() => {
            playSwoosh();
            setActiveOverlay("mindfulness_menu");
          }}
          className="w-full text-left p-3.5 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-100 rounded-2xl transition-all flex items-center gap-3.5 active:scale-98 mt-2"
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm shrink-0">
            <Heart className="w-5 h-5 fill-rose-500/10" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-black text-rose-950">🧘 Hộp công cụ Chánh niệm</div>
            <div className="text-[9px] text-rose-900/60 leading-tight">Nhật ký cảm xúc, Luyện thở Box Breathing, Sơ cứu tâm lý SOS</div>
          </div>
          <span className="text-rose-400 font-bold text-xs">➔</span>
        </button>
      </div>
    </div>
  );
}
