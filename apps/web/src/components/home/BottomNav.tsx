"use client";

import { useTranslations } from "next-intl";
import { Home, ListTodo, ShoppingBag, BookOpen, BarChart3, Settings, type LucideIcon } from "lucide-react";

/**
 * The app's single bottom navigation. Home is the pet + habits screen (always the
 * active base); the other four launch their module (shop / collection / stats /
 * settings). Keeping every destination here lets the header stay clean — one clear
 * place for navigation, so the header can be just streak + coins.
 *
 * Uses one consistent lucide icon set (unified weight/size) rather than the old mix
 * of coloured emoji/icons.
 */
export function BottomNav({
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
    <nav className="shrink-0 border-t border-black/[0.06] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ key, label, Icon, onClick, active }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 transition-colors ${
              active ? "text-earth-brown" : "text-earth-brown/45 hover:text-earth-brown/70"
            }`}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-bold leading-none">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
