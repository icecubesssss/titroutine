"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Play, X, Smartphone, AlertTriangle } from "lucide-react";
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
  const [hasStarted, setHasStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [failed, setFailed] = useState(false);
  
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [penaltySeconds, setPenaltySeconds] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  // Reset state when a new habit is opened
  useEffect(() => {
    if (habit) {
      setRemaining(habit.config.target_time ?? 15 * 60);
      setHasStarted(false);
      setFinished(false);
      setFailed(false);
      setPenaltySeconds(null);
      setIsFaceDown(false);
    }
  }, [habit]);

  const requestPermissionAndStart = async () => {
    type IOSDeviceOrientationEvent = { requestPermission?: () => Promise<"granted" | "denied"> };
    const win = window as unknown as { DeviceOrientationEvent: IOSDeviceOrientationEvent };

    if (
      typeof window !== "undefined" &&
      "DeviceOrientationEvent" in window &&
      typeof win.DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permissionState = await win.DeviceOrientationEvent.requestPermission();
        if (permissionState === "granted") {
          setPermissionStatus("granted");
        } else {
          setPermissionStatus("denied");
        }
      } catch (error) {
        console.error(error);
        setPermissionStatus("denied");
      }
    } else {
      // Non-iOS 13+ devices
      setPermissionStatus("granted");
    }
    setHasStarted(true);
  };

  // Handle Orientation and Visibility
  useEffect(() => {
    if (!hasStarted || finished || failed) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta;
      const gamma = event.gamma;
      // Beta range [-180, 180]. Face down means beta is close to 180 or -180, and gamma is near 0.
      if (beta !== null && gamma !== null) {
        const flipped = (beta > 140 || beta < -140) && (gamma > -45 && gamma < 45);
        setIsFaceDown(flipped);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Strict mode: leaving the app immediately fails the timer
        setFailed(true);
      }
    };

    if (permissionStatus === "granted") {
      window.addEventListener("deviceorientation", handleOrientation);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasStarted, finished, failed, permissionStatus]);

  // Timer logic
  useEffect(() => {
    if (!hasStarted || finished || failed) return;

    let timerId: NodeJS.Timeout;

    const requiresFlip = permissionStatus === "granted";

    if (requiresFlip && !isFaceDown) {
      // Penalty mode
      if (penaltySeconds === null) {
        setPenaltySeconds(5);
      }
      
      timerId = setInterval(() => {
        setPenaltySeconds((prev) => {
          if (prev !== null && prev <= 1) {
            setFailed(true);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      // Running mode
      if (penaltySeconds !== null) {
        setPenaltySeconds(null); // Clear penalty if they flip it back in time
      }
      
      timerId = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerId);
  }, [hasStarted, finished, failed, isFaceDown, penaltySeconds, permissionStatus]);

  if (!habit) return null;

  const elapsed = total - remaining;
  const progress = total > 0 ? (elapsed / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-earth-brown/10 p-6 flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-2">
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

        {/* Status UI */}
        <div className="flex flex-col items-center justify-center min-h-[200px] w-full text-center">
          {!hasStarted ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-fire-orange">
                <Smartphone size={40} />
              </div>
              <p className="text-stone-600 font-medium px-4">
                Chế độ Tập Trung Nghiêm Ngặt. Bạn sẽ cần <b>úp màn hình</b> điện thoại xuống mặt bàn để đếm giờ.
              </p>
              <DuoButton variant="primary" fullWidth size="lg" onClick={requestPermissionAndStart}>
                <span className="flex items-center gap-2 justify-center">
                  <Play size={20} /> Bắt Đầu Tập Trung
                </span>
              </DuoButton>
            </div>
          ) : failed ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-bold text-red-600">Thất bại!</h3>
              <p className="text-stone-600 font-medium">
                Bạn đã mất tập trung (rời khỏi ứng dụng hoặc lật màn hình lên).
              </p>
              <DuoButton variant="danger" fullWidth size="lg" onClick={onClose}>
                Thoát
              </DuoButton>
            </div>
          ) : finished ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-600">Hoàn Thành!</h3>
              <p className="text-stone-600 font-medium">Bạn đã tập trung rất xuất sắc.</p>
              <DuoButton variant="primary" fullWidth size="lg" onClick={() => onComplete(total)}>
                Nhận Phần Thưởng
              </DuoButton>
            </div>
          ) : (
            <div className="space-y-8 w-full">
              {penaltySeconds !== null ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-pulse">
                  <h3 className="text-red-600 font-bold text-lg mb-1">Cảnh Báo!</h3>
                  <p className="text-red-500 font-medium mb-2">Hãy úp màn hình xuống ngay!</p>
                  <div className="text-4xl font-black text-red-600">{penaltySeconds}s</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="text-7xl font-black tabular-nums text-earth-text tracking-tighter">
                    {format(remaining)}
                  </div>
                  <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-fire-orange transition-[width] duration-1000 ease-linear"
                      // eslint-disable-next-line
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {permissionStatus === "granted" && (
                    <p className="text-green-600 font-bold flex items-center gap-2 whitespace-pre-wrap">
                      <Smartphone className="rotate-180" size={18} /> Đang úp màn hình
                    </p>
                  )}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setFailed(true)}
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                Bỏ Cuộc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
