"use client";

import React, { useState } from "react";
import { X, Heart } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSound } from "@/hooks/useSound";

interface FirstAidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirstAidModal: React.FC<FirstAidModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations("FirstAid");
  const { playTing, playSwoosh } = useSound();
  const [activeTab, setActiveTab] = useState<"grounding" | "bubble" | "cards">("grounding");
  const [groundingStep, setGroundingStep] = useState(1);
  const [popCount, setPopCount] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [isSquished, setIsSquished] = useState(false);

  // Swipe drag motion values for Polaroid
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
  const opacity = useTransform(dragX, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

  if (!isOpen) return null;

  const handlePopBubble = () => {
    setPopCount((p) => p + 1);
    setIsSquished(true);
    playTing();
    setTimeout(() => setIsSquished(false), 150);

    // Generate random particles
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 120 - 40,
      color: ["#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"][Math.floor(Math.random() * 5)],
    }));
    setParticles((p) => [...p, ...newParticles]);

    setTimeout(() => {
      setParticles((p) => p.filter((x) => !newParticles.find((n) => n.id === x.id)));
    }, 600);
  };

  const groundingDetails = [
    { step: 1, title: t("gTitle1"), desc: t("gDesc1") },
    { step: 2, title: t("gTitle2"), desc: t("gDesc2") },
    { step: 3, title: t("gTitle3"), desc: t("gDesc3") },
    { step: 4, title: t("gTitle4"), desc: t("gDesc4") },
    { step: 5, title: t("gTitle5"), desc: t("gDesc5") },
  ];

  const affirmations = [
    { text: t("affirmation0"), img: "/assets/items/wallpaper_autumn.png" },
    { text: t("affirmation1"), img: "/assets/items/object_cozy_sofa.png" },
    { text: t("affirmation2"), img: "/assets/items/rug_star.png" },
    { text: t("affirmation3"), img: "/assets/items/object_scented_candle.png" },
  ];

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    const swipeThreshold = 100;
    if (info.offset.x < -swipeThreshold) {
      // Swipe left -> next card
      playSwoosh();
      setCardIndex((prev) => (prev === affirmations.length - 1 ? 0 : prev + 1));
    } else if (info.offset.x > swipeThreshold) {
      // Swipe right -> prev card
      playSwoosh();
      setCardIndex((prev) => (prev === 0 ? affirmations.length - 1 : prev - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#fffaf2] rounded-3xl shadow-2xl border-4 border-[#e6d8c3] overflow-hidden flex flex-col h-[80vh] animate-sheet-up text-[#5c4033] animate-bubble-pop">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-[#e6d8c3] bg-white sticky top-0 z-10">
          <h2 className="text-lg font-black text-red-700 flex items-center gap-1.5 animate-pulse">
            ❤️ {t("title")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("completed")}
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white border-b border-[#e6d8c3] text-xs font-bold divide-x divide-stone-100">
          <button
            onClick={() => { playSwoosh(); setActiveTab("grounding"); }}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "grounding"
                ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {t("tabGrounding")}
          </button>
          <button
            onClick={() => { playSwoosh(); setActiveTab("bubble"); }}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "bubble"
                ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {t("tabJelly")}
          </button>
          <button
            onClick={() => { playSwoosh(); setActiveTab("cards"); }}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "cards"
                ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500"
                : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            {t("tabComfort")}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-between">
          {activeTab === "grounding" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-stone-500 mb-4 leading-relaxed">
                  {t("gIntroTitle")}
                </h3>
                <div className="bg-white rounded-2xl border border-[#ebdcc5] p-5 shadow-sm space-y-3 min-h-[160px] flex flex-col justify-center animate-sheet-up">
                  <h4 className="text-[#c2410c] font-black text-sm">
                    {groundingDetails[groundingStep - 1]?.title}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-medium">
                    {groundingDetails[groundingStep - 1]?.desc}
                  </p>
                </div>
              </div>

              {/* Navigation Steps */}
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-stone-400">
                  {t("gStep", { step: groundingStep })}
                </span>
                <div className="flex gap-2 w-full">
                  {groundingStep > 1 && (
                    <button
                      onClick={() => { playSwoosh(); setGroundingStep((s) => s - 1); }}
                      className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
                    >
                      {t("prev")}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      playSwoosh();
                      if (groundingStep < 5) {
                        setGroundingStep((s) => s + 1);
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-[2] py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    {groundingStep < 5 ? t("next") : t("done")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bubble" && (
            <div className="flex flex-col items-center justify-between flex-1 py-4">
              <div className="text-center">
                <h3 className="text-sm font-black text-[#5c4033]">{t("jellyIntro")}</h3>
              </div>

              {/* Stress Bubble Jelly SVG */}
              <div className="relative py-8 flex flex-col items-center select-none">
                {/* Particles */}
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: p.x, y: p.y, scale: 0.2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute w-3 h-3 rounded-full pointer-events-none z-40 shadow-sm"
                    style={{
                      backgroundColor: p.color,
                      top: "50%",
                      left: "50%",
                      marginTop: "-6px",
                      marginLeft: "-6px",
                    }}
                  />
                ))}

                <div
                  onClick={handlePopBubble}
                  className="cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
                >
                  <svg viewBox="0 0 100 100" className="w-32 h-32 select-none filter drop-shadow-md">
                    <motion.path
                      d={
                        isSquished
                          ? "M 10,65 Q 50,88 90,65 Q 92,38 50,30 Q 8,38 10,65 Z"
                          : "M 15,55 Q 50,88 85,55 Q 75,18 50,18 Q 25,18 15,55 Z"
                      }
                      fill="url(#jelly-grad)"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="2.5"
                      animate={{
                        d: isSquished
                          ? "M 10,65 Q 50,88 90,65 Q 92,38 50,30 Q 8,38 10,65 Z"
                          : "M 15,55 Q 50,88 85,55 Q 75,18 50,18 Q 25,18 15,55 Z",
                      }}
                      transition={{ type: "spring", stiffness: 600, damping: 9 }}
                    />
                    <defs>
                      <linearGradient id="jelly-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="50%" stopColor="#e11d48" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-3xl select-none animate-pulse pointer-events-none">💖</span>
                </div>

                <div className="mt-6 bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1 rounded-full text-xs font-mono font-bold shadow-sm">
                  {t("popCount", { count: popCount })}
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black rounded-xl active:scale-95 transition-all"
              >
                {t("completed")}
              </button>
            </div>
          )}

          {activeTab === "cards" && (
            <div className="flex flex-col justify-between flex-1 space-y-6 py-2 items-center">
              {/* Polaroid card */}
              <div className="w-full max-w-[270px] relative h-[310px] flex items-center justify-center">
                <motion.div
                  style={{ x: dragX, rotate, opacity }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  className="absolute bg-white border-t-8 border-x-8 border-b-[38px] border-white rounded-xl shadow-xl p-3.5 flex flex-col items-center cursor-grab active:cursor-grabbing select-none w-full h-full justify-between"
                >
                  {/* Image wrapper */}
                  <div className="relative w-full h-[180px] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 flex items-center justify-center">
                    <Image
                      src={affirmations[cardIndex].img}
                      alt=""
                      fill
                      sizes="250px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[#e0d0b0]/5 pointer-events-none" />
                  </div>
                  
                  {/* Quote content */}
                  <div className="flex-1 flex items-center justify-center px-1 pt-3">
                    <p className="text-[11px] font-bold text-center leading-relaxed text-[#5c4033] italic">
                      &ldquo;{affirmations[cardIndex].text}&rdquo;
                    </p>
                  </div>
                  
                  <Heart className="absolute bottom-2 right-2 w-4 h-4 fill-red-400 text-red-400 animate-pulse" />
                  <span className="absolute bottom-2 left-2 text-[8px] font-mono text-stone-400 font-bold">
                    {cardIndex + 1} / {affirmations.length}
                  </span>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-3 w-full">
                {/* Indicator dots */}
                <div className="flex gap-1">
                  {affirmations.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i === cardIndex ? "bg-orange-500 w-3" : "bg-stone-300"} transition-all`}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => {
                      playSwoosh();
                      setCardIndex((idx) => (idx === 0 ? affirmations.length - 1 : idx - 1));
                    }}
                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
                  >
                    {t("prev")}
                  </button>
                  <button
                    onClick={() => {
                      playSwoosh();
                      if (cardIndex < affirmations.length - 1) {
                        setCardIndex((idx) => idx + 1);
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    {cardIndex < affirmations.length - 1 ? t("next") : t("completed")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
