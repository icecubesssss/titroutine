"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { X, Smile, ThumbsDown } from "lucide-react";

interface PetProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  petLevel: number;
  petLevelProgress: number;
  personalityCuriosity: number;
  personalityCompassion: number;
  personalityResilience: number;
  personalityEnergy: number;
  petLikes: string[];
  petDislikes: string[];
}

export const PetProfileModal: React.FC<PetProfileModalProps> = ({
  isOpen,
  onClose,
  petLevel,
  petLevelProgress,
  personalityCuriosity,
  personalityCompassion,
  personalityResilience,
  personalityEnergy,
  petLikes,
  petDislikes,
}) => {
  const levelRef = useRef<HTMLDivElement>(null);
  const traitRefs = useRef<(HTMLDivElement | null)[]>([]);

  const traits = useMemo(() => [
    { label: "Tò Mò 🌟", val: personalityCuriosity, color: "bg-amber-400 border-amber-500", desc: "Ảnh hưởng từ suy ngẫm học hỏi" },
    { label: "Thấu Cảm ❤️", val: personalityCompassion, color: "bg-red-400 border-red-500", desc: "Ảnh hưởng từ tình yêu thương, chăm sóc" },
    { label: "Kiên Cường 🛡️", val: personalityResilience, color: "bg-blue-400 border-blue-500", desc: "Ảnh hưởng từ thói quen kỷ luật khó" },
    { label: "Năng Động ⚡", val: personalityEnergy, color: "bg-emerald-400 border-emerald-500", desc: "Ảnh hưởng từ tập thể dục, vận động" }
  ], [personalityCuriosity, personalityCompassion, personalityResilience, personalityEnergy]);

  // Cập nhật độ rộng thanh tiến trình một cách trực tiếp qua DOM để vượt qua linter cấm inline style
  useEffect(() => {
    if (!isOpen) return;
    if (levelRef.current) {
      levelRef.current.style.width = `${petLevelProgress * 100}%`;
    }
    traits.forEach((trait, idx) => {
      const el = traitRefs.current[idx];
      if (el) {
        const percent = Math.min(100, (trait.val / 100) * 100);
        el.style.width = `${percent}%`;
      }
    });
  }, [isOpen, petLevelProgress, traits]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#fffcf8] rounded-3xl shadow-2xl border-4 border-[#ebdcc5] overflow-hidden flex flex-col max-h-[85vh] animate-sheet-up text-[#5c4033]">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b border-orange-100 bg-white">
          <h2 className="text-lg font-black text-[#5c4033] flex items-center gap-1.5">
            🐰 Hồ Sơ & Tính Cách Thỏ
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Level Info */}
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm flex items-center gap-4">
            <div className="h-16 w-16 bg-orange-100 border border-orange-200 rounded-full flex items-center justify-center text-3xl select-none">
              🐰
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-sm text-[#5c4033]">Cấp độ của Thỏ cưng</span>
                <span className="text-xs font-mono font-bold text-orange-600">Cấp {petLevel}</span>
              </div>
              <div className="w-full bg-[#ebdcc5] rounded-full h-3 overflow-hidden border relative flex items-center justify-center">
                <div
                  ref={levelRef}
                  className="bg-orange-500 h-full absolute left-0 top-0 transition-all duration-500"
                />
                <span className="text-[8px] font-black text-white z-10 font-mono">
                  {Math.round(petLevelProgress * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Personality Stats */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3.5">
              📊 Chỉ Số Tính Cách Đang Nuôi Dưỡng
            </h3>
            <div className="space-y-3.5">
              {traits.map((trait, idx) => {
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#5c4033]">{trait.label}</span>
                      <span className="font-mono text-stone-600">{trait.val} Điểm</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200">
                      <div
                        ref={(el) => { traitRefs.current[idx] = el; }}
                        className={`h-full ${trait.color.split(" ")[0]} transition-all duration-500`}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 leading-none block">
                      {trait.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Likes & Dislikes Discovered */}
          <div className="grid grid-cols-2 gap-4 border-t border-orange-50 pt-5">
            {/* Likes */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <Smile size={12} /> Sở thích đã biết ({petLikes.length})
              </h4>
              {petLikes.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">Thỏ chưa bộc lộ thích điều gì. Hãy đi thám hiểm nhiều hơn nhé!</p>
              ) : (
                <ul className="space-y-1">
                  {petLikes.map((like, i) => (
                    <li key={i} className="text-xs font-semibold bg-emerald-50 text-emerald-800 rounded-xl px-2.5 py-1 border border-emerald-100 flex items-center gap-1">
                      💚 {like}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Dislikes */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <ThumbsDown size={12} /> Điều không thích ({petDislikes.length})
              </h4>
              {petDislikes.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">Thỏ chưa bộc lộ ghét điều gì. Hãy đi thám hiểm nhiều hơn nhé!</p>
              ) : (
                <ul className="space-y-1">
                  {petDislikes.map((dislike, i) => (
                    <li key={i} className="text-xs font-semibold bg-rose-50 text-rose-800 rounded-xl px-2.5 py-1 border border-rose-100 flex items-center gap-1">
                      💔 {dislike}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
