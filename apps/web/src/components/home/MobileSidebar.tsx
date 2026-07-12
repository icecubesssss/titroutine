"use client";

import { useTranslations } from "next-intl";
import { Home, ListTodo, CircleUser, Compass, Heart, Users, Palette, ShoppingBag, BookOpen, BarChart3, Settings, Lock } from "lucide-react";

// Mobile slide-over navigation (md:hidden). Mirrors the desktop sidebar's route
// set. Each entry's behaviour lives in HomeView (passed as semantic callbacks);
// this component only owns the layout + locked/active styling.
export function MobileSidebar({
  open,
  onClose,
  activeTab,
  isDecorMode,
  currentStage,
  roomsAllUnlocked,
  onHome,
  onTasks,
  onProfile,
  onAdventure,
  onMindfulness,
  onNeighbors,
  onToggleDecor,
  onShop,
  onAlbum,
  onAnalytics,
  onSettings,
}: {
  open: boolean;
  onClose: () => void;
  activeTab: "habits" | "tasks";
  isDecorMode: boolean;
  currentStage: number;
  roomsAllUnlocked: boolean;
  onHome: () => void;
  onTasks: () => void;
  onProfile: () => void;
  onAdventure: () => void;
  onMindfulness: () => void;
  onNeighbors: () => void;
  onToggleDecor: () => void;
  onShop: () => void;
  onAlbum: () => void;
  onAnalytics: () => void;
  onSettings: () => void;
}) {
  const t = useTranslations("Home");

  if (!open) return null;

  const items = [
    { key: "home", label: t("home"), Icon: Home, onClick: onHome, active: activeTab === "habits" && !isDecorMode },
    { key: "tasks", label: t("tasks"), Icon: ListTodo, onClick: onTasks, active: activeTab === "tasks" && !isDecorMode },

    // Core game and mindfulness features
    { key: "profile", label: t("profile") || "Hồ sơ thỏ cưng", Icon: CircleUser, onClick: onProfile },
    { key: "adventure", label: t("adventure") || "Thám hiểm", Icon: Compass, onClick: onAdventure, locked: currentStage < 1 },
    { key: "mindfulness", label: t("care") || "Chánh niệm", Icon: Heart, onClick: onMindfulness },
    { key: "neighbors", label: t("neighbor") || "Hàng xóm", Icon: Users, onClick: onNeighbors, locked: !roomsAllUnlocked },
    { key: "decor", label: isDecorMode ? (t("decorDone") || "Xong trang trí") : (t("decor") || "Trang trí phòng"), Icon: Palette, onClick: onToggleDecor, locked: currentStage < 1, active: isDecorMode },

    // Utilities
    { key: "shop", label: t("shop"), Icon: ShoppingBag, onClick: onShop },
    { key: "album", label: t("memoryAlbum"), Icon: BookOpen, onClick: onAlbum },
    { key: "stats", label: t("analytics"), Icon: BarChart3, onClick: onAnalytics },
    { key: "settings", label: t("settings"), Icon: Settings, onClick: onSettings },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex md:hidden bg-black/45 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-64 h-full bg-theme-bg shadow-2xl border-r border-theme-card-border p-5 flex flex-col justify-between animate-slide-right text-theme-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar">
          {/* Header with Close */}
          <div className="flex items-center justify-between shrink-0 px-1 border-b border-theme-card-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🐰</span>
              <div>
                <h1 className="text-base font-black tracking-tight leading-none text-theme-text">Titroutine</h1>
                <span className="text-[9px] font-bold text-theme-text/45 tracking-wider uppercase">Workspace</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-theme-text/45 hover:text-theme-text/80 font-bold p-1 rounded-full hover:bg-black/[0.03]"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1">
            {items.map(({ key, label, Icon, onClick, active, locked }) => (
              <button
                key={key}
                type="button"
                disabled={locked}
                onClick={onClick}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl transition-all font-bold text-sm ${
                  active
                    ? "bg-theme-accent text-white shadow-sm"
                    : locked
                    ? "text-theme-text/30 cursor-not-allowed opacity-50"
                    : "text-theme-text/65 hover:bg-theme-accent-light hover:text-theme-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                  <span>{label}</span>
                </div>
                {locked && <Lock className="h-3 w-3 text-theme-text/30 shrink-0" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer vibe in slide-over */}
        <div className="flex flex-col gap-1.5 bg-white/40 border border-white/20 p-4 rounded-[20px] shadow-sm backdrop-blur-sm text-center shrink-0">
          <span className="text-xs font-black text-theme-text/80 leading-snug">
            {t("footerGreeting")}
          </span>
          <span className="text-[9px] font-bold text-theme-text/45 tracking-wide">
            {t("footerSub")}
          </span>
        </div>
      </div>
    </div>
  );
}
