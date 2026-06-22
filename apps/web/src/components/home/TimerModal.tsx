"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, X } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import type { HabitWithLog } from "@/lib/types";

interface TimerModalProps {
  habit: HabitWithLog | null;
  onClose: () => void;
  onComplete: (seconds: number) => void;
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const TimerModal: React.FC<TimerModalProps> = ({ habit, onClose, onComplete }) => {
  const t = useTranslations("Timer");
  const total = habit?.config.target_time ?? 15 * 60;

  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset whenever a new timer habit is opened.
  useEffect(() => {
    if (habit) {
      setRemaining(habit.config.target_time ?? 15 * 60);
      setRunning(true);
      setFinished(false);
    }
  }, [habit]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  if (!habit) return null;

  const elapsed = total - remaining;
  const progress = total > 0 ? (elapsed / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-earth-text truncate pr-2">{habit.title}</h2>
          <button
            aria-label={t("cancel")}
            title={t("cancel")}
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress ring (simple bar) */}
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-6xl font-black tabular-nums text-earth-text">{format(remaining)}</div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-fire-orange transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {finished ? (
            <DuoButton variant="primary" fullWidth size="lg" onClick={() => onComplete(total)}>
              ✅ {t("done")}
            </DuoButton>
          ) : (
            <>
              <DuoButton
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => setRunning((r) => !r)}
              >
                <span className="flex items-center gap-2">
                  {running ? <Pause size={20} /> : <Play size={20} />}
                  {running ? t("pause") : t("resume")}
                </span>
              </DuoButton>
              <button
                type="button"
                onClick={() => onComplete(elapsed)}
                className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t("finishEarly")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
