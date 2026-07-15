"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Play, X, Smartphone, AlertTriangle, Music, Lock, Eye } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import { claimKeepsakeAction } from "@/app/[locale]/actions";
import { useIsMobile } from "@/hooks/useIsMobile";

type FocusMode = "strict" | "normal";

interface TimerModalProps {
  /** Session title shown in the header (habit or task name). */
  title: string;
  /** Countdown length in seconds. */
  durationSeconds: number;
  /** Grant a random keepsake on finish (habits). Tasks pass false. */
  reward?: boolean;
  defaultFocusMode?: "strict" | "normal";
  onClose: () => void;
  onComplete: (seconds: number) => void;
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const TimerModal: React.FC<TimerModalProps> = ({ title, durationSeconds, reward = false, defaultFocusMode = "strict", onClose, onComplete }) => {
  const t = useTranslations("Timer");
  const total = durationSeconds;

  const [remaining, setRemaining] = useState(total);
  const [hasStarted, setHasStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [failed, setFailed] = useState(false);

  // Strict = must flip phone face-down. Normal = just don't leave the app.
  const [focusMode, setFocusMode] = useState<FocusMode>(defaultFocusMode);

  const [isFaceDown, setIsFaceDown] = useState(false);
  const [penaltySeconds, setPenaltySeconds] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");

  // Background music audio state & keepsake reward
  const [audioVibe, setAudioVibe] = useState<"none" | "lofi" | "rain">("none");
  const [earnedKeepsake, setEarnedKeepsake] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setFocusMode("normal");
    } else {
      setFocusMode(defaultFocusMode);
    }
  }, [isMobile, defaultFocusMode]);

  // Flip-to-focus only applies in strict mode once orientation permission is granted.
  const requiresFlip = focusMode === "strict" && permissionStatus === "granted" && isMobile;

  // Audio track switching during focusing
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const isRunning = hasStarted && !finished && !failed && (!requiresFlip || isFaceDown);

    if (isRunning && audioVibe !== "none") {
      audioRef.current.src =
        audioVibe === "lofi"
          ? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [hasStarted, finished, failed, isFaceDown, audioVibe, requiresFlip]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Keepsake select once finished (habits only)
  useEffect(() => {
    if (reward && finished && !earnedKeepsake) {
      const keepsakes = ["keepsake_clover", "keepsake_pencil", "keepsake_magnifying_glass", "keepsake_hourglass"];
      const random = keepsakes[Math.floor(Math.random() * keepsakes.length)];
      setEarnedKeepsake(random);
    }
  }, [reward, finished, earnedKeepsake]);

  const startFocus = async () => {
    // Only strict mode needs the device-orientation sensor (iOS 13+ gates it
    // behind a permission prompt). Normal mode just watches for app-switching.
    if (focusMode === "strict") {
      type IOSDeviceOrientationEvent = { requestPermission?: () => Promise<"granted" | "denied"> };
      const win = window as unknown as { DeviceOrientationEvent: IOSDeviceOrientationEvent };

      if (
        typeof window !== "undefined" &&
        "DeviceOrientationEvent" in window &&
        typeof win.DeviceOrientationEvent.requestPermission === "function"
      ) {
        try {
          const permissionState = await win.DeviceOrientationEvent.requestPermission();
          setPermissionStatus(permissionState === "granted" ? "granted" : "denied");
        } catch (error) {
          console.error(error);
          setPermissionStatus("denied");
        }
      } else {
        // Non-iOS 13+ devices grant orientation access implicitly.
        setPermissionStatus("granted");
      }
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
        // Both modes fail if you leave the app mid-session.
        setFailed(true);
      }
    };

    if (requiresFlip) {
      window.addEventListener("deviceorientation", handleOrientation);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasStarted, finished, failed, requiresFlip]);

  // Timer logic
  useEffect(() => {
    if (!hasStarted || finished || failed) return;

    let timerId: NodeJS.Timeout;

    if (requiresFlip && !isFaceDown) {
      // Penalty mode: strict session with the phone facing up.
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
  }, [hasStarted, finished, failed, isFaceDown, penaltySeconds, requiresFlip]);

  useEffect(() => {
    if (progressRef.current) {
      const progress = hasStarted ? ((total - remaining) / total) * 100 : 0;
      progressRef.current.style.width = `${progress}%`;
    }
  }, [remaining, total, hasStarted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-earth-brown/10 p-6 flex flex-col items-center animate-bubble-pop">
        <div className="w-full flex items-center justify-between mb-2">
          <h2 className="text-lg font-black text-earth-text truncate pr-2">{title}</h2>
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
            <div className="space-y-4 animate-in slide-in-from-bottom-4 w-full">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-fire-orange">
                <Smartphone size={40} />
              </div>

              {/* Focus mode selection */}
              {isMobile && (
                <div className="w-full flex flex-col gap-2 text-left px-4">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                    {t("focusModeLabel")}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFocusMode("strict")}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        focusMode === "strict"
                          ? "border-fire-orange bg-orange-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span className={`flex items-center gap-1 text-xs font-black ${focusMode === "strict" ? "text-fire-orange" : "text-stone-500"}`}>
                        <Lock size={12} /> {t("modeStrict")}
                      </span>
                      <span className="block text-[10px] font-medium text-stone-400 mt-0.5">{t("modeStrictSub")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFocusMode("normal")}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        focusMode === "normal"
                          ? "border-fire-orange bg-orange-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span className={`flex items-center gap-1 text-xs font-black ${focusMode === "normal" ? "text-fire-orange" : "text-stone-500"}`}>
                        <Eye size={12} /> {t("modeNormal")}
                      </span>
                      <span className="block text-[10px] font-medium text-stone-400 mt-0.5">{t("modeNormalSub")}</span>
                    </button>
                  </div>
                </div>
              )}

              <p className="text-stone-600 font-medium text-xs px-4">
                {focusMode === "strict" ? t("strictFocus") : (isMobile ? t("normalFocus") : t("desktopFocus"))}
              </p>

              {/* BGM Audio Selection */}
              <div className="w-full border-t border-black/[0.05] pt-4 mt-2 flex flex-col gap-2 text-left px-4">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <Music size={12} /> {t("audioBgm")}
                </span>
                <div className="flex gap-1.5 w-full bg-stone-100 p-1 rounded-xl">
                  {(["none", "lofi", "rain"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAudioVibe(mode)}
                      className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                        audioVibe === mode
                          ? "bg-white text-earth-text shadow-sm"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      {mode === "none" ? t("audioNone") : mode === "lofi" ? t("audioLofi") : t("audioRain")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 pt-2">
                <DuoButton variant="primary" fullWidth size="lg" onClick={startFocus}>
                  <span className="flex items-center gap-2 justify-center">
                    <Play size={20} /> {t("startFocus")}
                  </span>
                </DuoButton>
              </div>
            </div>
          ) : failed ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-bold text-red-600">{t("failed")}</h3>
              <p className="text-stone-600 font-medium text-xs">
                {t("failedSub")}
              </p>
              <DuoButton variant="danger" fullWidth size="lg" onClick={onClose}>
                {t("quit")}
              </DuoButton>
            </div>
          ) : finished ? (
            <div className="space-y-4 animate-in zoom-in-95 flex flex-col items-center w-full">
              <div className="text-6xl mb-2 animate-bounce">🎉</div>
              <h3 className="text-2xl font-black text-green-600">{t("completed")}</h3>
              <p className="text-stone-600 font-medium text-xs">{t("completedSub")}</p>

              {reward && earnedKeepsake && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 my-2 flex flex-col items-center shadow-inner max-w-xs w-full animate-bubble-pop">
                  <span className="text-[10px] font-black text-amber-800/80 mb-2 uppercase tracking-wide">{t("keepsakeEarned")}</span>
                  <span className="text-4xl mb-1 select-none">
                    {earnedKeepsake === "keepsake_clover"
                      ? "🍀"
                      : earnedKeepsake === "keepsake_pencil"
                      ? "✏️"
                      : earnedKeepsake === "keepsake_magnifying_glass"
                      ? "🔍"
                      : "⏳"}
                  </span>
                  <span className="text-xs font-black text-amber-900">{t(earnedKeepsake)}</span>
                </div>
              )}

              <DuoButton
                variant="primary"
                fullWidth
                size="lg"
                disabled={isClaiming}
                onClick={async () => {
                  if (reward && earnedKeepsake) {
                    setIsClaiming(true);
                    try {
                      await claimKeepsakeAction(earnedKeepsake);
                    } catch (e) {
                      console.error("Keepsake unlock failed:", e);
                    }
                    setIsClaiming(false);
                  }
                  onComplete(total);
                }}
              >
                {isClaiming ? t("done") : reward ? t("claimReward") : t("done")}
              </DuoButton>
            </div>
          ) : (
            <div className="space-y-8 w-full">
              {penaltySeconds !== null ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-pulse">
                  <h3 className="text-red-600 font-bold text-lg mb-1">{t("warning")}</h3>
                  <p className="text-red-500 font-medium mb-2 text-xs">{t("warningSub")}</p>
                  <div className="text-4xl font-black text-red-600">{penaltySeconds}s</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="text-7xl font-black tabular-nums text-earth-text tracking-tighter">
                    {format(remaining)}
                  </div>
                  <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden shadow-inner">
                    <div
                      ref={progressRef}
                      className="h-full bg-fire-orange transition-[width] duration-1000 ease-linear"
                    />
                  </div>

                  {/* BGM Toggle Switch during Focus */}
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex gap-2 justify-center bg-stone-50 border border-stone-100 p-1 rounded-lg">
                      {(["none", "lofi", "rain"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setAudioVibe(mode)}
                          className={`px-3 py-1 rounded text-[9px] font-black transition-all ${
                            audioVibe === mode
                              ? "bg-white text-earth-text shadow-sm border border-stone-200"
                              : "text-stone-400 hover:text-stone-500"
                          }`}
                        >
                          {mode === "none" ? t("audioNone") : mode === "lofi" ? "Lofi 🎧" : "Rain 🌧️"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {requiresFlip ? (
                    <p className="text-green-600 font-bold text-xs flex items-center gap-2 whitespace-pre-wrap">
                      <Smartphone className="rotate-180" size={18} /> {t("strictRunning")}
                    </p>
                  ) : (
                    <p className="text-stone-500 font-bold text-xs flex items-center gap-2 whitespace-pre-wrap">
                      <Eye size={16} /> {t("normalRunning")}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setFailed(true)}
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                {t("giveUp")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
