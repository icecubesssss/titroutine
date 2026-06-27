"use client";

import React from "react";
import { X, Lock, Heart, Award } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MEMORIES } from "@/lib/memories";

interface MemoryAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  /** Keys persisted server-side; an unlocked memory stays unlocked after a reset. */
  unlockedMemories: string[];
}

export const MemoryAlbumModal: React.FC<MemoryAlbumModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  unlockedMemories,
}) => {
  const t = useTranslations("Memory");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-800/20 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-stone-200 bg-amber-900/5">
          <h2 className="text-2xl font-black text-amber-900 flex items-center gap-2">
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

        {/* Scrollable Album Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-stone-100">
          <div className="text-center text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
            ✨ {t("subtitle")} ✨
          </div>
          
          <div className="space-y-8">
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
                        <div className="mt-3 text-stone-700 font-serif italic text-sm">
                          &ldquo;{memory.caption}&rdquo;
                        </div>
                      </div>
                      
                      <div className="w-full flex items-center justify-between mt-4 text-xs font-bold text-amber-800">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-red-400 text-red-400" /> {t(`${memory.key}_title`)}
                        </span>
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
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
      </div>
    </div>
  );
};
