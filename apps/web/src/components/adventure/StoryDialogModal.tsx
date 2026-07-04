"use client";

import React, { useTransition } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { completeAdventureAction } from "@/app/[locale]/actions";
import { useRouter } from "next/navigation";
import { ADVENTURE_STORIES, type AdventureStory } from "@/lib/adventure_stories";

interface StoryDialogModalProps {
  isOpen: boolean;
  storyId: string | null;
  onClose: () => void;
}

export const StoryDialogModal: React.FC<StoryDialogModalProps> = ({
  isOpen,
  storyId,
  onClose,
}) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!isOpen || !storyId) return null;

  const story: AdventureStory | undefined = ADVENTURE_STORIES.find((s) => s.id === storyId);

  const handleSelectChoice = (choiceIndex: "A" | "B") => {
    startTransition(async () => {
      const res = await completeAdventureAction(choiceIndex);
      if (!res.error) {
        router.refresh();
        onClose();
      }
    });
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#fffcf8] rounded-3xl border-4 border-[#e6dcc3] p-6 shadow-2xl flex flex-col items-center justify-between text-[#5c4033] animate-sheet-up">
        
        {/* Top bar */}
        <div className="w-full flex items-center justify-between border-b border-orange-100 pb-3">
          <div className="flex items-center gap-1.5 font-black text-xs text-orange-700 uppercase tracking-wide">
            <BookOpen size={14} /> Chuyện thám hiểm tại {story.location}
          </div>
          <span className="text-[10px] font-bold bg-amber-100 px-2 py-0.5 rounded-full text-amber-900">
            Thưởng 💰15
          </span>
        </div>

        {/* Narrative & Dialog Bubble */}
        <div className="w-full flex flex-col items-center py-6">
          {/* Simple Cute Bunny Silhouette Illustration */}
          <div className="h-28 w-28 bg-[#ebdcc5]/40 rounded-full flex items-center justify-center border border-[#ebdcc5] relative mb-5">
            <span className="text-5xl select-none animate-bounce-slow">🐰🎒</span>
            <div className="absolute -bottom-1 -right-1 bg-white h-7 w-7 rounded-full flex items-center justify-center shadow border border-orange-200">
              <Sparkles size={14} className="text-orange-500 fill-orange-100 animate-pulse" />
            </div>
          </div>

          {/* Chatbubble */}
          <div className="relative w-full bg-white border-2 border-[#ebdcc5] rounded-3xl p-5 shadow-sm">
            <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-[#ebdcc5] rotate-45" />
            <p className="text-sm font-semibold text-stone-700 leading-relaxed text-center">
              &ldquo;{story.storyText}&rdquo;
            </p>
          </div>
        </div>

        {/* Choice Option Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => handleSelectChoice("A")}
            className="w-full text-left p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 hover:from-orange-100/90 hover:to-amber-100/90 border-2 border-[#e6d8c3] hover:border-orange-300 rounded-2xl transition-all duration-150 active:scale-98 shadow-sm flex flex-col disabled:opacity-50"
          >
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
              LỰA CHỌN A:
            </span>
            <span className="text-xs font-black text-[#5c4033] mt-0.5 leading-snug">
              {story.choiceA.text}
            </span>
            <span className="text-[9px] text-orange-600/90 font-bold mt-1 leading-none italic">
              (Nuôi dưỡng: {story.choiceA.trait === "curiosity" ? "Tò Mò 🌟" : story.choiceA.trait === "compassion" ? "Thấu Cảm ❤️" : story.choiceA.trait === "resilience" ? "Kiên Cường 🛡️" : "Năng Động ⚡"})
            </span>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => handleSelectChoice("B")}
            className="w-full text-left p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 hover:from-orange-100/90 hover:to-amber-100/90 border-2 border-[#e6d8c3] hover:border-orange-300 rounded-2xl transition-all duration-150 active:scale-98 shadow-sm flex flex-col disabled:opacity-50"
          >
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
              LỰA CHỌN B:
            </span>
            <span className="text-xs font-black text-[#5c4033] mt-0.5 leading-snug">
              {story.choiceB.text}
            </span>
            <span className="text-[9px] text-orange-600/90 font-bold mt-1 leading-none italic">
              (Nuôi dưỡng: {story.choiceB.trait === "curiosity" ? "Tò Mò 🌟" : story.choiceB.trait === "compassion" ? "Thấu Cảm ❤️" : story.choiceB.trait === "resilience" ? "Kiên Cường 🛡️" : "Năng Động ⚡"})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
