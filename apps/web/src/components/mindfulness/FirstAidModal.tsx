"use client";

import React, { useState } from "react";
import { X, Heart, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FirstAidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AFFIRMATIONS = [
  "Cơn bão cảm xúc nào rồi cũng sẽ qua đi. Hiện tại, bạn đang an toàn và được bảo vệ. 🕊️",
  "Bạn không cần phải hoàn hảo. Chỉ cần bạn cố gắng từng chút một, điều đó đã rất đáng quý rồi. 🌱",
  "Hãy hít một hơi thật sâu. Thở ra thật chậm. Bạn đã làm rất tốt để vượt qua ngày hôm nay. 💖",
  "Nỗi sợ hãi hay lo lắng chỉ là một cảm xúc nhất thời, chúng không định nghĩa con người bạn. 🛡️"
];

export const FirstAidModal: React.FC<FirstAidModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"grounding" | "bubble" | "cards">("grounding");
  const [groundingStep, setGroundingStep] = useState(1);
  const [popCount, setPopCount] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  if (!isOpen) return null;

  const handlePopBubble = () => {
    setPopCount(p => p + 1);
    
    // Generate random particles
    const newParticles = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100 - 60, // float upwards
      color: ["#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#c084fc"][Math.floor(Math.random() * 5)]
    }));
    setParticles(p => [...p, ...newParticles]);

    setTimeout(() => {
      setParticles(p => p.filter(x => !newParticles.find(n => n.id === x.id)));
    }, 600);
  };

  const groundingDetails = [
    { step: 1, title: "👀 Nhìn thấy 5 vật xung quanh", desc: "Hãy tập trung nhìn vào 5 vật thể xung quanh bạn ngay bây giờ (ví dụ: chiếc ly, màn hình máy tính, quyển sách, cây xanh...)." },
    { step: 2, title: "👋 Cảm nhận 4 kết cấu cơ thể", desc: "Chạm vào và cảm nhận 4 thứ bên cạnh bạn (chăn ấm, tay áo thô ráp, mặt bàn gỗ mát lạnh, hay làn da của chính bạn...)." },
    { step: 3, title: "👂 Nghe thấy 3 âm thanh", desc: "Nhắm mắt lại và lắng nghe 3 âm thanh xung quanh (tiếng quạt vù vù, tiếng mưa rơi, tiếng chim hót xa xa, hay nhịp thở của chính bạn...)." },
    { step: 4, title: "👃 Ngửi thấy 2 mùi hương", desc: "Cố gắng ngửi 2 mùi hương trong không gian hiện tại (mùi cà phê thơm dịu, mùi tinh dầu ấm áp, hay mùi giấy sách...)." },
    { step: 5, title: "👅 Nếm thấy 1 hương vị", desc: "Nhận thức 1 hương vị trong khoang miệng bạn (vị trà ngọt nhẹ, vị mát của ngụm nước vừa uống...)." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#fffaf2] rounded-3xl shadow-2xl border-4 border-[#e6d8c3] overflow-hidden flex flex-col h-[80vh] animate-sheet-up text-[#5c4033]">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-[#e6d8c3] bg-white sticky top-0 z-10">
          <h2 className="text-lg font-black text-red-700 flex items-center gap-1.5 animate-pulse">
             SOS Cứu Hộ Tâm Lý
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white border-b border-[#e6d8c3] text-xs font-bold divide-x divide-stone-100">
          <button
            onClick={() => setActiveTab("grounding")}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "grounding" ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Grounding 5-4-3-2-1
          </button>
          <button
            onClick={() => setActiveTab("bubble")}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "bubble" ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Bóp bóng xả giận
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex-1 py-3 text-center transition-all ${
              activeTab === "cards" ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500" : "text-stone-500 hover:bg-stone-50"
            }`}
          >
            Thẻ an ủi
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-between">
          {activeTab === "grounding" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-[#5c4033] mb-4">
                  Phép neo mặt đất (5-4-3-2-1 Grounding) giúp bạn nhanh chóng thoát khỏi cảm giác hoảng loạn bằng cách kết nối lại với giác quan.
                </h3>
                <div className="bg-white rounded-2xl border border-[#ebdcc5] p-5 shadow-sm space-y-3 min-h-[160px] flex flex-col justify-center">
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
                  BƯỚC {groundingStep} / 5
                </span>
                <div className="flex gap-2 w-full">
                  {groundingStep > 1 && (
                    <button
                      onClick={() => setGroundingStep(s => s - 1)}
                      className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
                    >
                      Quay lại
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (groundingStep < 5) {
                        setGroundingStep(s => s + 1);
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-[2] py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    {groundingStep < 5 ? "Tôi đã làm xong, tiếp tục" : "Tôi cảm thấy ổn hơn rồi"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "bubble" && (
            <div className="flex flex-col items-center justify-between flex-1 py-4">
              <div className="text-center">
                <h3 className="text-sm font-black">Nhấn liên tục vào thạch để xả bớt lo âu</h3>
                <p className="text-[11px] text-stone-500 mt-1">Đừng nén giận, hãy bóp dẹp miếng thạch lấp lánh này nào!</p>
              </div>

              {/* Stress Bubble Jelly */}
              <div className="relative py-8 flex flex-col items-center">
                {/* Render flying particles */}
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: p.x, y: p.y, scale: 0.2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute w-3.5 h-3.5 rounded-full pointer-events-none z-40 shadow-sm"
                    style={{ backgroundColor: p.color, top: "50%", left: "50%", marginTop: "-7px", marginLeft: "-7px" }}
                  />
                ))}

                <motion.button
                  onClick={handlePopBubble}
                  whileTap={{ scaleX: 1.28, scaleY: 0.72, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 600, damping: 10 }}
                  aria-label="Bóng xả stress"
                  className="h-32 w-32 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-300 border-4 border-white/60 shadow-[0_10px_30px_rgba(244,63,94,0.3),inset_0_4px_8px_rgba(255,255,255,0.8)] focus:outline-none cursor-pointer flex items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute top-3 left-4 h-4 w-4 bg-white/60 rounded-full blur-[1px]" />
                  <span className="text-3xl select-none animate-pulse">💖</span>
                </motion.button>
                <div className="mt-4 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm">
                  Đã ấn: <span className="text-sm font-black">{popCount}</span> lần
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black rounded-xl active:scale-95 transition-all"
              >
                Hoàn thành
              </button>
            </div>
          )}

          {activeTab === "cards" && (
            <div className="flex flex-col justify-between flex-1 space-y-8 py-2">
              <div className="bg-white rounded-3xl border border-[#ebdcc5] p-6 shadow-md min-h-[180px] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -top-6 -right-6 h-16 w-16 bg-orange-100/50 rounded-full" />
                <HelpCircle className="text-orange-400 w-8 h-8 opacity-45" />
                <p className="text-sm font-bold text-center leading-relaxed text-[#6b4c3e] italic mt-3">
                  &ldquo;{AFFIRMATIONS[cardIndex]}&rdquo;
                </p>
                <div className="flex justify-center mt-4">
                  <Heart className="w-5 h-5 fill-red-400 text-red-400 animate-pulse" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1">
                  {AFFIRMATIONS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i === cardIndex ? "bg-orange-500 w-3" : "bg-stone-300"} transition-all`}
                    />
                  ))}
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setCardIndex(idx => (idx === 0 ? AFFIRMATIONS.length - 1 : idx - 1))}
                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl active:scale-95 transition-all"
                  >
                    Xem thẻ trước
                  </button>
                  <button
                    onClick={() => {
                      if (cardIndex < AFFIRMATIONS.length - 1) {
                        setCardIndex(idx => idx + 1);
                      } else {
                        onClose();
                      }
                    }}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-sm"
                  >
                    {cardIndex < AFFIRMATIONS.length - 1 ? "Xem thẻ tiếp theo" : "Đã đọc xong"}
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
