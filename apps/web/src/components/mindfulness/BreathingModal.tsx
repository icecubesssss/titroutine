"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { X, Play, Pause, Volume2, VolumeX, Award } from "lucide-react";
import { motion } from "framer-motion";
import { completeBreathingAction } from "@/app/[locale]/actions";
import { useRouter } from "next/navigation";

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreatheState = "inhale" | "holdIn" | "exhale" | "holdOut";

const STAGES = {
  inhale: { label: "HÍT VÀO", duration: 4, scaleClass: "scale-110 bg-emerald-400" },
  holdIn: { label: "NÍN GIỮ", duration: 4, scaleClass: "scale-110 bg-teal-400" },
  exhale: { label: "THỞ RA", duration: 4, scaleClass: "scale-75 bg-[#66b38c]" },
  holdOut: { label: "NÍN GIỮ", duration: 4, scaleClass: "scale-75 bg-[#3a6850]" },
};

export const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(120); // 2 phút đếm ngược
  const [isActive, setIsActive] = useState(false);
  const [breatheState, setBreatheState] = useState<BreatheState>("inhale");
  const [stageSecondsLeft, setStageSecondsLeft] = useState(4);
  const [muted, setMuted] = useState(true);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && progressRef.current) {
      progressRef.current.style.width = `${(totalSecondsLeft / 120) * 100}%`;
    }
  }, [totalSecondsLeft, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Khởi tạo audio loop thư giãn lofi hoặc sóng biển
    audioRef.current = new Audio("/assets/sounds/meditation_bell.mp3"); // fallback or loop
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  // Điều khiển âm thanh
  useEffect(() => {
    if (!audioRef.current) return;
    if (isActive && !muted) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isActive, muted]);

  // Bộ đếm thời gian chính & Chu kỳ thở
  useEffect(() => {
    if (!isOpen || !isActive || totalSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      // 1. Giảm tổng thời gian còn lại
      setTotalSecondsLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });

      // 2. Giảm thời gian của pha thở hiện tại
      setStageSecondsLeft((prev) => {
        if (prev <= 1) {
          // Chuyển pha thở (Box Breathing Loop)
          setBreatheState((curr) => {
            if (curr === "inhale") return "holdIn";
            if (curr === "holdIn") return "exhale";
            if (curr === "exhale") return "holdOut";
            return "inhale";
          });
          return 4; // Reset thời gian pha thở về 4 giây
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, totalSecondsLeft]);

  const handleFinish = () => {
    setIsActive(false);
    if (audioRef.current) audioRef.current.pause();
    setFinished(true);
  };

  const handleClaimReward = () => {
    startTransition(async () => {
      const res = await completeBreathingAction();
      if (!res.error) {
        router.refresh();
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeStage = STAGES[breatheState];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1713] text-white animate-fade-in">
      <div className="w-full max-w-md bg-[#16271e] rounded-3xl border-4 border-[#2b4438] p-6 shadow-2xl flex flex-col h-[75vh] items-center justify-between relative overflow-hidden">
        
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between z-10">
          <span className="text-xs font-bold bg-[#20362b] px-3 py-1 rounded-full text-emerald-400 border border-emerald-800">
            Box Breathing 4-4-4-4
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Mở âm thanh" : "Tắt âm thanh"}
              className="p-2 rounded-full bg-[#20362b] hover:bg-[#2c473a] text-stone-300 transition-colors"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-2 rounded-full bg-[#20362b] hover:bg-[#2c473a] text-stone-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!finished ? (
          <>
            {/* Center Breathing Visual */}
            <div className="flex flex-col items-center justify-center flex-1 py-8 relative">
              
              {/* Outer pulsing ring */}
              <div className="absolute h-56 w-56 rounded-full border border-emerald-500/20 animate-ping opacity-30" />

              {/* Central Circle with Spring & Timing Physics */}
              <motion.div
                animate={isActive ? {
                  scale: breatheState === "inhale" || breatheState === "holdIn" ? 1.18 : 0.75,
                  backgroundColor: breatheState === "inhale"
                    ? "#34d399"
                    : breatheState === "holdIn"
                    ? "#2dd4bf"
                    : breatheState === "exhale"
                    ? "#66b38c"
                    : "#3a6850",
                  boxShadow: breatheState === "holdIn"
                    ? [
                        "0 0 30px rgba(45,212,191,0.3)",
                        "0 0 60px rgba(45,212,191,0.6)",
                        "0 0 30px rgba(45,212,191,0.3)"
                      ]
                    : "0 0 30px rgba(52,211,153,0.2)"
                } : {
                  scale: 1.0,
                  backgroundColor: "#20362b",
                  boxShadow: "0 0 20px rgba(16,185,129,0.1)"
                }}
                transition={isActive ? {
                  scale: { duration: 4, ease: "easeInOut" },
                  backgroundColor: { duration: 4, ease: "linear" },
                  boxShadow: breatheState === "holdIn" ? {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut"
                  } : { duration: 1 }
                } : { duration: 0.5 }}
                className="h-40 w-40 rounded-full flex flex-col items-center justify-center text-[#0f1713] select-none"
              >
                <span className="text-[10px] tracking-widest font-black opacity-80 uppercase">
                  {isActive ? activeStage.label : "CHƯA BẮT ĐẦU"}
                </span>
                <span className="text-3xl font-black mt-1">
                  {isActive ? `${stageSecondsLeft}s` : "⏳"}
                </span>
              </motion.div>
              
              <span className="mt-8 text-sm text-stone-400 text-center font-medium max-w-[250px]">
                {isActive 
                  ? "Hãy thả lỏng vai, hít thở sâu theo chu kỳ nở rộng của vòng tròn."
                  : "Nhấn Phát để bắt đầu buổi luyện thở dài 2 phút giúp xoa dịu tâm trí."}
              </span>
            </div>

            {/* Bottom Controls */}
            <div className="w-full flex flex-col items-center gap-4 z-10">
              {/* Countdown Progress bar */}
              <div className="w-full bg-[#20362b] rounded-full h-2 overflow-hidden border border-emerald-950/40">
                <div
                  ref={progressRef}
                  className="bg-emerald-400 h-full transition-all duration-1000"
                />
              </div>
              <div className="flex justify-between w-full text-xs text-stone-400 font-mono font-bold">
                <span>Còn lại: {formatTime(totalSecondsLeft)}</span>
                <span>Mục tiêu: 02:00</span>
              </div>

              {/* Play / Pause button */}
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-stone-600 text-white hover:bg-stone-500"
                    : "bg-emerald-500 text-[#0f1713] hover:bg-emerald-400 hover:shadow-emerald-950/20"
                }`}
              >
                {isActive ? (
                  <>
                    <Pause size={16} fill="currentColor" /> TẠM DỪNG
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" /> BẮT ĐẦU LUYỆN THỞ
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Finished Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
            <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500 animate-bounce">
              <Award className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-emerald-400">Tuyệt vời!</h3>
              <p className="text-stone-300 text-sm mt-2 max-w-[280px]">
                Bạn đã hoàn thành 2 phút luyện thở Box Breathing đầy tĩnh lặng. Bé thỏ rất tự hào về bạn!
              </p>
            </div>
            <button
              onClick={handleClaimReward}
              disabled={pending}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-[#0e1713] font-black text-sm rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {pending ? "Đang nhận..." : "NHẬN 💰10 & ❤️ THÂN THIẾT"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
