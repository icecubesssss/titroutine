"use client";

import React, { useTransition } from "react";
import { Heart } from "lucide-react";
import { claimVibeAction } from "@/app/[locale]/actions";
import { useRouter } from "next/navigation";
import type { SocialVibe } from "@/lib/types";

interface VibeInboxModalProps {
  isOpen: boolean;
  vibes: SocialVibe[];
  onClose: () => void;
}

export const VibeInboxModal: React.FC<VibeInboxModalProps> = ({
  isOpen,
  vibes,
  onClose,
}) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!isOpen || vibes.length === 0) return null;

  const currentVibe = vibes[0]; // Process one vibe at a time
  if (!currentVibe) return null;

  const handleClaim = () => {
    startTransition(async () => {
      const res = await claimVibeAction(currentVibe.id);
      if (!res.error) {
        router.refresh();
        if (vibes.length <= 1) {
          onClose();
        }
      }
    });
  };

  const getVibeDetails = (type: string) => {
    switch (type) {
      case "hug":
        return {
          title: "Cái ôm ấm áp 🫂",
          emoji: "🫂❤️",
          msg: "gửi tặng bạn một chiếc ôm ảo thật chặt để tiếp thêm năng lượng lành mạnh!"
        };
      case "water":
        return {
          title: "Nhắc uống nước 💧",
          emoji: "💧🥤",
          msg: "nhắc nhở bạn uống một cốc nước mát để giữ tỉnh táo và khỏe khoắn!"
        };
      case "cheer":
        return {
          title: "Lời cổ vũ 🎉",
          emoji: "🎉💪",
          msg: "gửi lời cổ vũ nhiệt tình! Chúc bạn hoàn thành xuất sắc các thói quen hôm nay!"
        };
      default:
        return {
          title: "Rung cảm tích cực ✨",
          emoji: "✨💖",
          msg: "gửi tặng bạn những năng lượng tích cực và bình yên!"
        };
    }
  };

  const details = getVibeDetails(currentVibe.vibeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#fffcf8] rounded-3xl border-4 border-[#e6dcc3] p-6 shadow-2xl flex flex-col items-center justify-between text-[#5c4033] animate-sheet-up">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-orange-100 pb-2.5">
          <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-1">
            📬 Hòm Thư Rung Cảm
          </span>
          <span className="text-[10px] font-bold text-gray-400">
            Còn {vibes.length} thư
          </span>
        </div>

        {/* Content */}
        <div className="py-6 flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-4xl select-none animate-bounce-slow">
            {details.emoji}
          </div>
          <div>
            <h3 className="text-sm font-black text-[#5c4033]">
              Bạn nhận được {details.title}!
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mt-2 max-w-[240px]">
              Bạn hàng xóm <strong className="text-orange-600 font-black">@{currentVibe.senderUsername}</strong> {details.msg}
            </p>
          </div>
        </div>

        {/* Claim CTA Button */}
        <button
          type="button"
          disabled={pending}
          onClick={handleClaim}
          className="w-full py-3 bg-gradient-to-r from-rose-400 to-orange-500 hover:from-rose-500 hover:to-orange-600 text-white font-black text-xs rounded-2xl shadow-md shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <Heart size={12} fill="currentColor" /> ĐÓN NHẬN & CẢM ƠN (+5 ❤️)
        </button>
      </div>
    </div>
  );
};
