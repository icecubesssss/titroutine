"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import { WHATS_NEW_ITEMS } from "@/lib/announcements";

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** One-time "what's new" popup listing the latest batch of changes. */
export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("WhatsNew");

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fdfaf6] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#ebdcc5] flex flex-col max-h-[calc(100dvh-2rem)]">
        <div className="shrink-0 pt-6 pb-4 px-6 flex items-start justify-between gap-3 border-b-2 border-[#ebdcc5] bg-white">
          <div>
            <h2 className="text-xl font-black text-[#5c4033]">✨ {t("title")}</h2>
            <p className="mt-0.5 text-xs text-stone-500">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-3">
          {WHATS_NEW_ITEMS.map((item) => (
            <li key={item.key} className="flex items-start gap-3 bg-white border border-[#ebdcc5]/70 rounded-2xl p-3">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg font-black text-amber-800">
                {item.emoji}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-[#5c4033]">{t(`items.${item.key}.title`)}</h3>
                <p className="mt-0.5 text-xs text-stone-600 leading-snug">{t(`items.${item.key}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="shrink-0 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t-2 border-[#ebdcc5] bg-white">
          <DuoButton
            type="button"
            onClick={onClose}
            className="w-full bg-theme-accent text-white py-3 rounded-2xl font-bold text-sm shadow-sm"
          >
            {t("gotIt")}
          </DuoButton>
        </div>
      </div>
    </div>,
    document.body
  );
};
