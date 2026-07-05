"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { X, Globe, Music, Volume2, VolumeX, LogOut } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { Howl } from "howler";
import { DuoButton } from "../ui/DuoButton";
import { signOut } from "@/app/[locale]/login/actions";

interface ReportData {
  streak: number;
  coins: number;
  habitsCompleted: number;
  totalHabits: number;
  petStage: "rabbit" | "egg";
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportData;
  email: string | null;
  currentTheme?: "neutral" | "matcha" | "ube";
  onThemeChange?: (theme: "neutral" | "matcha" | "ube") => void;
  devStageOverride?: number | null;
  setDevStageOverride?: (stage: number | null) => void;
  devStreakOverride?: number | null;
  setDevStreakOverride?: (streak: number | null) => void;
  devLevelOverride?: number | null;
  setDevLevelOverride?: (level: number | null) => void;
  devSatietyOverride?: number | null;
  setDevSatietyOverride?: (satiety: number | null) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  report,
  email,
  currentTheme = "neutral",
  onThemeChange,
  devStageOverride = null,
  setDevStageOverride,
  devStreakOverride = null,
  setDevStreakOverride,
  devLevelOverride = null,
  setDevLevelOverride,
  devSatietyOverride = null,
  setDevSatietyOverride,
}) => {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [reportEmail, setReportEmail] = useState(email ?? "");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [isSigningOut, startSignOut] = useTransition();
  const musicRef = useRef<Howl | null>(null);

  useEffect(() => {
    setReportEmail(email ?? "");
  }, [email]);

  useEffect(() => {
    // Lazily create the Howl so a missing/broken asset never throws on mount.
    if (!musicRef.current) {
      musicRef.current = new Howl({
        src: ["/assets/sounds/lofi.mp3"],
        loop: true,
        volume: 0.3,
        onloaderror: () => setIsMusicPlaying(false),
      });
    }
    const music = musicRef.current;
    if (isMusicPlaying) {
      if (!music.playing()) music.play();
    } else {
      music.pause();
    }
  }, [isMusicPlaying]);

  if (!isOpen) return null;

  const changeLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const sendReport = async () => {
    if (!reportEmail) return;
    setReportStatus("sending");
    try {
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: reportEmail,
          streak: report.streak,
          coins: report.coins,
          habitsCompleted: report.habitsCompleted,
          totalHabits: report.totalHabits,
          petStage: report.petStage,
        }),
      });
      const data = await res.json();
      setReportStatus(data.success ? "sent" : "error");
    } catch {
      setReportStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-theme-card-bg rounded-3xl shadow-2xl overflow-hidden border-4 border-theme-card-border max-h-[90vh] overflow-y-auto text-theme-text">
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-theme-card-border sticky top-0 bg-theme-card-bg z-10">
          <h2 className="text-2xl font-black text-theme-text flex items-center gap-2">
            ⚙️ {t("title")}
          </h2>
          <button
            aria-label={t("close")}
            title={t("close")}
            onClick={onClose}
            className="p-2 rounded-full bg-theme-accent-light hover:bg-theme-border/20 transition-colors text-theme-text/70"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Language */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              <Globe size={16} /> {t("language")}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "en", flag: "🇺🇸" },
                { code: "vi", flag: "🇻🇳" },
                { code: "zh", flag: "🇨🇳" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-bold transition-all ${
                    locale === lang.code
                      ? "border-theme-accent bg-theme-accent-light text-theme-accent"
                      : "border-theme-card-border bg-theme-card-bg text-theme-text/60 hover:bg-theme-accent-light/50"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-xs">{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              🎨 {t("theme")}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "neutral", label: t("themeNeutral"), emoji: "🧈" },
                { code: "matcha", label: t("themeMatcha"), emoji: "🍵" },
                { code: "ube", label: t("themeUbe"), emoji: "🍠" },
              ].map((tItem) => (
                <button
                  key={tItem.code}
                  onClick={() => onThemeChange?.(tItem.code as "neutral" | "matcha" | "ube")}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-bold transition-all ${
                    currentTheme === tItem.code
                      ? "border-theme-accent bg-theme-accent-light text-theme-accent"
                      : "border-theme-card-border bg-theme-card-bg text-theme-text/60 hover:bg-theme-accent-light/50"
                  }`}
                >
                  <span className="text-2xl">{tItem.emoji}</span>
                  <span className="text-xs">{tItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              <Music size={16} /> {t("audio")}
            </h3>
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    isMusicPlaying ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isMusicPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </div>
                <div>
                  <div className="font-bold text-earth-text">{t("lofi")}</div>
                  <div className="text-xs text-gray-400">{t("lofiSub")}</div>
                </div>
              </div>

              <button
                aria-label={t("toggleMusic")}
                title={t("toggleMusic")}
                onClick={() => setIsMusicPlaying((p) => !p)}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                  isMusicPlaying ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                    isMusicPlaying ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Email report */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              ✉️ {t("reports")}
            </h3>
            <div className="flex flex-col gap-3 p-4 border-2 border-gray-200 rounded-2xl">
              <input
                type="email"
                value={reportEmail}
                onChange={(e) => {
                  setReportEmail(e.target.value);
                  setReportStatus("idle");
                }}
                placeholder={t("emailPlaceholder")}
                aria-label={t("emailPlaceholder")}
                className="w-full p-2 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none"
              />
              <DuoButton
                variant="primary"
                size="sm"
                disabled={reportStatus === "sending" || !reportEmail}
                onClick={sendReport}
              >
                {reportStatus === "sending" ? t("sending") : t("sendReport")}
              </DuoButton>
              {reportStatus === "sent" && (
                <p className="text-sm font-medium text-green-600">{t("reportSent")}</p>
              )}
              {reportStatus === "error" && (
                <p className="text-sm font-medium text-red-600">{t("reportError")}</p>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider text-sm">
              👤 {t("account")}
            </h3>
            {email && <p className="text-sm font-medium text-gray-500 truncate">{email}</p>}
            <button
              type="button"
              onClick={() => startSignOut(() => signOut(locale))}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gray-200 font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut size={18} /> {t("signOut")}
            </button>
          </div>

          {/* Developer Tools */}
          {setDevStageOverride && setDevStreakOverride && (
            <div className="space-y-4 pt-6 border-t-2 border-dashed border-gray-100">
              <h3 className="font-bold text-red-500 flex items-center gap-2 uppercase tracking-wider text-sm">
                🛠️ Developer Tools (Thử nghiệm)
              </h3>
              <div className="p-4 bg-red-50/50 rounded-2xl border-2 border-red-100 space-y-4">
                {/* Streak Override */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 block">
                    Giả lập số ngày Streak ({devStreakOverride !== null ? devStreakOverride : report.streak} ngày):
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1050"
                    aria-label="Giả lập số ngày Streak"
                    title="Giả lập số ngày Streak"
                    value={devStreakOverride !== null ? devStreakOverride : report.streak}
                    onChange={(e) => setDevStreakOverride(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                    <span>0 ngày</span>
                    <span>1000+ ngày</span>
                  </div>
                </div>

                {/* Stage Override */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 block">
                    Ép buộc chọn Stage (Bỏ qua Streak):
                  </label>
                  <select
                    aria-label="Ép buộc chọn Stage"
                    title="Ép buộc chọn Stage"
                    value={devStageOverride === null ? "auto" : devStageOverride.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDevStageOverride(val === "auto" ? null : parseInt(val));
                    }}
                    className="w-full p-2 bg-white border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none text-sm font-medium"
                  >
                    <option value="auto">Mặc định (Theo Streak)</option>
                    <option value="0">Stage 0: Trứng (Egg)</option>
                    <option value="1">Stage 1: Thỏ con (Baby)</option>
                    <option value="2">Stage 2: Thỏ nhỡ (Young)</option>
                    <option value="3">Stage 3: Thỏ tâm linh (Spirit)</option>
                    <option value="4">Stage 4: Bé tai thỏ (Child)</option>
                    <option value="5">Stage 5: Thiếu nữ tai thỏ (Teen)</option>
                    <option value="6">Stage 6: Cô gái tai thỏ (Woman)</option>
                  </select>
                </div>

                {/* Pet nurture level override (previews room unlocks) */}
                {setDevLevelOverride && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 block">
                      Giả lập Cấp độ nuôi ({devLevelOverride !== null ? devLevelOverride : "auto"}) — mở khoá phòng:
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      aria-label="Giả lập Cấp độ nuôi"
                      title="Giả lập Cấp độ nuôi"
                      value={devLevelOverride !== null ? devLevelOverride : 1}
                      onChange={(e) => setDevLevelOverride(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                      <span>Lv1 (Phòng riêng)</span>
                      <span>Lv11+ (Đủ 5 phòng)</span>
                    </div>
                  </div>
                )}

                {/* Satiety override (previews mood: đói → buồn) */}
                {setDevSatietyOverride && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 block">
                      Giả lập thanh No ({devSatietyOverride !== null ? devSatietyOverride : "auto"}):
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      aria-label="Giả lập thanh No"
                      title="Giả lập thanh No"
                      value={devSatietyOverride !== null ? devSatietyOverride : 100}
                      onChange={(e) => setDevSatietyOverride(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                      <span>0 (Đói → buồn)</span>
                      <span>100 (No)</span>
                    </div>
                  </div>
                )}

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => {
                    setDevStageOverride(null);
                    setDevStreakOverride(null);
                    setDevLevelOverride?.(null);
                    setDevSatietyOverride?.(null);
                  }}
                  className="w-full py-1.5 rounded-xl border border-red-200 bg-white font-bold text-red-500 text-xs hover:bg-red-50 transition-colors"
                >
                  Xóa bỏ bộ nhớ giả lập (Reset)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
