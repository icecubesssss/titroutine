"use client";

import { useTranslations } from "next-intl";
import { Home, ListTodo, ShoppingBag, BookOpen, BarChart3, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function DesktopSidebar({
  activeTab = "habits",
  onHome,
  onTasks,
  onShop,
  onAlbum,
  onAnalytics,
  onSettings,
}: {
  activeTab?: "habits" | "tasks";
  onHome: () => void;
  onTasks: () => void;
  onShop: () => void;
  onAlbum: () => void;
  onAnalytics: () => void;
  onSettings: () => void;
}) {
  const t = useTranslations("Home");

  const items: { key: string; label: string; Icon: LucideIcon; onClick: () => void; active?: boolean }[] = [
    { key: "home", label: t("home"), Icon: Home, onClick: onHome, active: activeTab === "habits" },
    { key: "tasks", label: t("tasks"), Icon: ListTodo, onClick: onTasks, active: activeTab === "tasks" },
    { key: "shop", label: t("shop"), Icon: ShoppingBag, onClick: onShop },
    { key: "album", label: t("memoryAlbum"), Icon: BookOpen, onClick: onAlbum },
    { key: "stats", label: t("analytics"), Icon: BarChart3, onClick: onAnalytics },
    { key: "settings", label: t("settings"), Icon: Settings, onClick: onSettings },
  ];

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col justify-between border-r border-theme-border bg-white/50 backdrop-blur-md p-5 h-full text-theme-text select-none">
      <div className="flex flex-col gap-7">
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
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl transition-all font-bold text-sm ${
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
      <div className="flex flex-col gap-1.5 bg-white/40 border border-white/20 p-4 rounded-[20px] shadow-sm backdrop-blur-sm text-center">
        <span className="text-xs font-black text-theme-text/80 leading-snug">
          {t("footerGreeting")}
        </span>
        <span className="text-[9px] font-bold text-theme-text/45 tracking-wide">
          {t("footerSub")}
        </span>
      </div>
    </aside>
  );
}
