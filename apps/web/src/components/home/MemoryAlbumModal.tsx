"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Heart, Award } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { MEMORIES } from "@/lib/memories";
import { getAiDiariesAction } from "@/app/[locale]/actions";

interface MemoryAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  unlockedMemories: string[];
  unlockedItems: string[];
}

export const MemoryAlbumModal: React.FC<MemoryAlbumModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  unlockedMemories,
  unlockedItems,
}) => {
  const t = useTranslations("Memory");
  const tTimer = useTranslations("Timer");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<"memories" | "diaries" | "keepsakes">("memories");

  // Pet diaries state
  const [diaries, setDiaries] = useState<{ logged_date: string; diary_content: string; unlocked_photo_url: string | null }[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "diaries") {
      setLoadingDiaries(true);
      getAiDiariesAction().then((res) => {
        if (res && "diaries" in res) {
          setDiaries(res.diaries || []);
        }
        setLoadingDiaries(false);
      });
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const KEEPSAKES = [
    { id: "keepsake_clover", emoji: "🍀" },
    { id: "keepsake_pencil", emoji: "✏️" },
    { id: "keepsake_magnifying_glass", emoji: "🔍" },
    { id: "keepsake_hourglass", emoji: "⏳" },
  ];

  const lockedMsg = locale === "zh" ? "需完成 Pomodoro" : locale === "en" ? "Focus Pomodoro required" : "Cần hoàn thành Pomodoro";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-800/20 max-h-[85vh] flex flex-col animate-bubble-pop">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-stone-200 bg-amber-900/5">
          <h2 className="text-xl font-black text-amber-900 flex items-center gap-2">
            📔 {t("title")}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            title={t("close")}
            onClick={onClose}
            className="p-2 rounded-full bg-stone-200 hover:bg-stone-300 transition-colors text-stone-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Album Tabs */}
        <div className="flex bg-white border-b border-stone-200 text-[10px] font-black divide-x divide-stone-100">
          <button
            type="button"
            onClick={() => setActiveTab("memories")}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "memories" ? "bg-amber-50/50 text-amber-800 border-b-2 border-amber-600" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {t("tabMemories")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("diaries")}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "diaries" ? "bg-amber-50/50 text-amber-800 border-b-2 border-amber-600" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {t("tabDiaries")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("keepsakes")}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "keepsakes" ? "bg-amber-50/50 text-amber-800 border-b-2 border-amber-600" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {t("tabKeepsakes")}
          </button>
        </div>

        {/* Scrollable Album Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-100">
          {activeTab === "memories" && (
            <div className="space-y-6">
              <div className="text-center text-stone-500 text-[10px] font-black uppercase tracking-wider mb-2">
                ✨ {t("subtitle")} ✨
              </div>
              <div className="space-y-6">
                {MEMORIES.map((memory) => {
                  const isUnlocked =
                    unlockedMemories.includes(memory.key) || currentStreak >= memory.requiredStreak;

                  return (
                    <div
                      key={memory.key}
                      className={`bg-white p-4 rounded-2xl shadow-md border-2 ${
                        isUnlocked
                          ? "border-amber-800/10 active:scale-[0.98] transition-transform"
                          : "border-stone-200 opacity-80"
                      }`}
                    >
                      {isUnlocked ? (
                        <div className="flex flex-col items-center">
                          {/* Polaroid Image Frame */}
                          <div className="bg-stone-50 p-2 pb-5 border border-stone-200 shadow-sm rounded flex flex-col items-center w-full">
                            <div className="relative w-full aspect-square overflow-hidden rounded border border-stone-100">
                              <Image
                                src={memory.imageUrl}
                                alt={memory.title}
                                fill
                                sizes="(max-width: 400px) 100vw, 400px"
                                className="object-cover"
                              />
                            </div>
                            <div className="mt-3 text-stone-700 font-serif italic text-sm text-center px-2">
                              &ldquo;{memory.caption}&rdquo;
                            </div>
                          </div>
                          
                          <div className="w-full flex items-center justify-between mt-4 text-xs font-bold text-amber-800">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 fill-red-400 text-red-400" /> {t(`${memory.key}_title`)}
                            </span>
                            <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[10px]">
                              <Award className="w-3.5 h-3.5" /> {t("streakBadge", { days: memory.requiredStreak })}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                          <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-stone-400" />
                          </div>
                          <div className="font-bold text-stone-600 mb-1">{t(`${memory.key}_title`)}</div>
                          <div className="text-xs text-stone-500">
                            {t("lockedHint", { days: memory.requiredStreak })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "diaries" && (
            <div className="space-y-6">
              {loadingDiaries ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                  <div className="w-8 h-8 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mb-4" />
                </div>
              ) : diaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-stone-400 text-center px-6">
                  <div className="text-5xl mb-4 select-none animate-bounce">📝</div>
                  <p className="text-xs font-black leading-relaxed">{t("emptyDiaries")}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diaries.map((diary) => (
                    <div
                      key={diary.logged_date}
                      className="bg-white border-t-8 border-x-8 border-b-[36px] border-white rounded-xl shadow-md p-3.5 flex flex-col items-center select-none animate-bubble-pop"
                    >
                      {/* Polaroid Image */}
                      <div className="relative w-full aspect-square overflow-hidden rounded border border-stone-100 bg-[#fbf9f4] flex items-center justify-center">
                        <Image
                          src="/assets/ui/icon_profile.png"
                          alt=""
                          width={140}
                          height={140}
                          className="object-contain p-4 filter saturate-75"
                        />
                        <div className="absolute inset-0 bg-[#e0d0b0]/5 pointer-events-none" />
                      </div>
                      
                      {/* Caption text */}
                      <div className="mt-3.5 w-full px-1">
                        <div className="text-[9px] font-black text-amber-800/70 uppercase tracking-wider mb-1 font-mono">
                          📅 {diary.logged_date}
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed font-serif italic">
                          &ldquo;{diary.diary_content}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "keepsakes" && (
            <div className="space-y-6">
              {unlockedItems.filter(x => x.startsWith("keepsake_")).length === 0 && (
                <p className="text-[10px] text-center font-bold text-stone-400 leading-snug px-6 pt-2 pb-4">
                  {t("emptyKeepsakes")}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {KEEPSAKES.map((ks) => {
                  const isUnlocked = unlockedItems.includes(ks.id);
                  return (
                    <div
                      key={ks.id}
                      className={`bg-white rounded-2xl border-2 p-4 flex flex-col items-center justify-center text-center shadow-md relative transition-all ${
                        isUnlocked ? "border-amber-500/20 bg-amber-50/20 animate-bubble-pop" : "border-stone-200 opacity-60"
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          <span className="text-5xl mb-2.5 select-none animate-pulse">{ks.emoji}</span>
                          <span className="text-xs font-black text-amber-900 leading-tight">
                            {tTimer(ks.id)}
                          </span>
                          <span className="text-[9px] font-bold text-stone-500 mt-1.5 leading-snug">
                            {tTimer(`${ks.id}_desc`)}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                            <Lock className="w-5 h-5 text-stone-400" />
                          </div>
                          <span className="text-[10px] font-black text-stone-500 leading-tight">
                            {tTimer(ks.id)}
                          </span>
                          <span className="text-[8px] font-bold text-stone-400 mt-1 leading-snug">
                            {lockedMsg}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
