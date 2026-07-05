"use client";

import { useTranslations } from "next-intl";
import { Home, ShoppingBag, BookOpen, BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function DesktopSidebar({
  onHome,
  onShop,
  onAlbum,
  onAnalytics,
  onSettings,
}: {
  onHome: () => void;
  onShop: () => void;
  onAlbum: () => void;
  onAnalytics: () => void;
  onSettings: () => void;
}) {
  const t = useTranslations("Home");

  const items: { key: string; label: string; Icon: LucideIcon; onClick: () => void; active?: boolean }[] = [
    { key: "home", label: t("home"), Icon: Home, onClick: onHome, active: true },
    { key: "shop", label: t("shop"), Icon: ShoppingBag, onClick: onShop },
    { key: "album", label: t("memoryAlbum"), Icon: BookOpen, onClick: onAlbum },
    { key: "stats", label: t("analytics"), Icon: BarChart3, onClick: onAnalytics },
    { key: "settings", label: t("settings"), Icon: Settings, onClick: onSettings },
  ];

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between border-r border-black/[0.06] bg-white/50 backdrop-blur-md p-6 h-full text-theme-text select-none">
      <div className="flex flex-col gap-8">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5 px-2">
          <span className="text-3xl">🐰</span>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-theme-text">Titroutine</h1>
            <span className="text-[10px] font-bold text-theme-text/45 tracking-wider uppercase">Workspace</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {items.map(({ key, label, Icon, onClick, active }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                active
                  ? "bg-theme-accent text-white shadow-sm"
                  : "text-theme-text/65 hover:bg-theme-accent-light hover:text-theme-accent"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Footer Vibe signature */}
      <div className="flex flex-col gap-1.5 bg-white/40 border border-white/20 p-4.5 rounded-[22px] shadow-sm backdrop-blur-sm text-center">
        <span className="text-xs font-black text-theme-text/80 leading-snug">
          Chúc bạn một ngày an yên! 🌱
        </span>
        <span className="text-[9px] font-bold text-theme-text/45 tracking-wide">
          Cùng thỏ cưng xây dựng thói quen tốt
        </span>
      </div>
    </aside>
  );
}
