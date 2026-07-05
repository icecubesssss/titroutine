"use client";

import React, { useState, useTransition } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { logMoodAction } from "@/app/[locale]/actions";
import { useRouter } from "next/navigation";

interface MoodCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOODS = [
  { value: "awful", label: "Rất tệ", emoji: "😭", color: "bg-red-100 hover:bg-red-200 border-red-300 text-red-700" },
  { value: "bad", label: "Không tốt", emoji: "🙁", color: "bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700" },
  { value: "neutral", label: "Bình thường", emoji: "😐", color: "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-700" },
  { value: "good", label: "Khá tốt", emoji: "🙂", color: "bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-700" },
  { value: "awesome", label: "Tuyệt vời", emoji: "😆", color: "bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700" }
];

const TAGS = [
  { id: "work", label: "Công việc 💼" },
  { id: "family", label: "Gia đình 🏠" },
  { id: "sleep", label: "Giấc ngủ 😴" },
  { id: "friends", label: "Bạn bè 👥" },
  { id: "health", label: "Sức khỏe 🩺" },
  { id: "food", label: "Ăn uống 🍎" },
  { id: "weather", label: "Thời tiết ⛅" },
  { id: "hobbies", label: "Giải trí 🎮" }
];

export const MoodCheckinModal: React.FC<MoodCheckinModalProps> = ({ isOpen, onClose }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!isOpen) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = () => {
    if (!selectedMood) return;
    startTransition(async () => {
      const res = await logMoodAction(selectedMood, selectedTags, reflection);
      if (!res.error) {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#fdfaf6] rounded-3xl shadow-2xl border-4 border-[#ebdcc5] overflow-hidden flex flex-col animate-sheet-up">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b border-orange-100 bg-white">
          <h2 className="text-lg font-black text-[#5c4033] flex items-center gap-1.5">
            💭 Nhật Ký Cảm Xúc
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Question 1: Mood */}
          <div>
            <h3 className="text-sm font-bold text-[#5c4033] mb-3 text-center">
              Hôm nay bạn thấy thế nào?
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {MOODS.map((mood) => {
                const isActive = selectedMood === mood.value;
                return (
                  <motion.button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    whileHover={{ scale: 1.12, y: -4 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-colors ${
                      isActive
                        ? `${mood.color} ring-4 ring-orange-200 font-black border-transparent`
                        : "border-[#f0e6d2] bg-white text-stone-600"
                    }`}
                  >
                    <span className="text-3xl select-none">{mood.emoji}</span>
                    <span className="text-[10px] font-bold mt-0.5">{mood.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Tags */}
          <div>
            <h3 className="text-sm font-bold text-[#5c4033] mb-3">
              Cảm xúc này liên quan đến điều gì? (Chọn thẻ)
            </h3>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <motion.button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                        : "bg-white border-[#f0e6d2] text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {tag.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Gratitude Reflection */}
          <div>
            <h3 className="text-sm font-bold text-[#5c4033] mb-3">
              Ghi chép nhanh điều bạn biết ơn hôm nay:
            </h3>
            <textarea
              rows={3}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Hôm nay có điều gì nhỏ bé làm bạn mỉm cười không? Gõ vào đây nhé..."
              className="w-full rounded-2xl border-2 border-[#ebdcc5] bg-white p-3 text-sm text-[#5c4033] placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-6 border-t border-orange-100 bg-white">
          <button
            type="button"
            disabled={!selectedMood || pending}
            onClick={handleSubmit}
            className={`w-full py-3 rounded-2xl font-black text-sm text-white shadow-md transition-all flex items-center justify-center gap-1.5 ${
              selectedMood && !pending
                ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg active:scale-95"
                : "bg-gray-300 shadow-none cursor-not-allowed"
            }`}
          >
            {pending ? "Đang lưu..." : "HOÀN THÀNH - NHẬN 💰15"}
          </button>
        </div>
      </div>
    </div>
  );
};
