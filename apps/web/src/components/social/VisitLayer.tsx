"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { DoorOpen, Heart, Lock, X } from "lucide-react";
import { claimCoopsAction, endVisitAction, sendCoopAction } from "@/app/[locale]/actions";
import { COOP_KINDS, COOP_KIND_ORDER, coopBlockReason, type CoopKind } from "@/lib/coop";
import type { ActiveVisit, PendingCoop } from "@/lib/types";

interface VisitLayerProps {
  visit: ActiveVisit | null;
  pendingCoops: PendingCoop[];
  coopUsedToday: Partial<Record<CoopKind, number>>;
  /** The user's own bond level — gates the more intimate co-op actions. */
  affection: number;
  /** Fired after a co-op lands so the room can play the duo animation. */
  onCoopPlayed?: (kind: CoopKind) => void;
  /** Called after the visit ends / rewards are claimed, to pull fresh server data. */
  onRefresh?: () => void;
}

/**
 * Everything that appears in the room while a visit is in progress: the "who is
 * here" banner, the co-op action dock, and the card for collecting co-op rewards
 * that arrived while the user was away.
 *
 * Mounted once inside the room, as a pass-through overlay — only the cards
 * themselves capture pointer events, so the room underneath stays interactive.
 */
export const VisitLayer: React.FC<VisitLayerProps> = ({
  visit,
  pendingCoops,
  coopUsedToday,
  affection,
  onCoopPlayed,
  onRefresh,
}) => {
  const t = useTranslations("Visits");
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Optimistic mirror of today's counts so a capped action greys out instantly.
  const [sentNow, setSentNow] = useState<Partial<Record<CoopKind, number>>>({});
  const [claimResult, setClaimResult] = useState<number | null>(null);
  const [dismissedClaim, setDismissedClaim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usedToday = (kind: CoopKind) => (coopUsedToday[kind] ?? 0) + (sentNow[kind] ?? 0);

  const handleSend = (kind: CoopKind) => {
    setError(null);
    setSentNow((prev) => ({ ...prev, [kind]: (prev[kind] ?? 0) + 1 }));
    onCoopPlayed?.(kind);
    startTransition(async () => {
      const res = await sendCoopAction(kind);
      if (res?.error) {
        // Roll the optimistic count back — the action refused it.
        setSentNow((prev) => ({ ...prev, [kind]: Math.max(0, (prev[kind] ?? 1) - 1) }));
        setError(res.error);
        return;
      }
      onRefresh?.();
    });
  };

  const handleEnd = () => {
    startTransition(async () => {
      await endVisitAction();
      setIsDockOpen(false);
      onRefresh?.();
    });
  };

  const handleClaim = () => {
    startTransition(async () => {
      const res = await claimCoopsAction();
      if (res?.error) {
        setError(res.error);
        return;
      }
      setClaimResult(res.affectionGained ?? 0);
      onRefresh?.();
    });
  };

  const showClaimCard = pendingCoops.length > 0 && !dismissedClaim;
  if (!visit && !showClaimCard && claimResult === null) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3">
      {/* ── Top: rewards that arrived while we were away ──────────────────── */}
      <div className="flex justify-center">
        {showClaimCard && claimResult === null && (
          <div className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xl leading-none">
              {COOP_KINDS[pendingCoops[0].kind].emoji}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-stone-800 truncate">
                {t("claimTitle", {
                  name: pendingCoops[0].actorCharacterName,
                  count: pendingCoops.length,
                })}
              </p>
              <p className="text-[10px] text-stone-500">{t("claimBody")}</p>
            </div>
            <button
              type="button"
              onClick={handleClaim}
              disabled={pending}
              className="shrink-0 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-[11px] shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {t("claim")}
            </button>
            <button
              type="button"
              onClick={() => setDismissedClaim(true)}
              aria-label={t("dismiss")}
              title={t("dismiss")}
              className="shrink-0 p-1 text-stone-400 hover:text-stone-600 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {claimResult !== null && (
          <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 bg-rose-500 text-white rounded-2xl shadow-md animate-in fade-in zoom-in duration-300">
            <Heart size={14} className="fill-white" />
            <span className="text-[11px] font-black">
              {t("claimed", { amount: claimResult })}
            </span>
            <button
              type="button"
              onClick={() => setClaimResult(null)}
              aria-label={t("dismiss")}
              title={t("dismiss")}
              className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom: who is here + what we can do together ─────────────────── */}
      {visit && (
        <div className="flex flex-col items-center gap-2">
          {error && (
            <span className="pointer-events-auto px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[10px] font-bold">
              {t(errorKey(error))}
            </span>
          )}

          {isDockOpen && (
            <div className="pointer-events-auto w-full max-w-sm p-2.5 bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-wider text-stone-400">
                {t("coopTitle")}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {COOP_KIND_ORDER.map((kind) => {
                  const config = COOP_KINDS[kind];
                  const blocked = coopBlockReason(kind, affection, usedToday(kind));
                  const left = Math.max(0, config.dailyLimit - usedToday(kind));
                  return (
                    <button
                      key={kind}
                      type="button"
                      disabled={pending || blocked !== null}
                      onClick={() => handleSend(kind)}
                      title={
                        blocked === "locked"
                          ? t("coopLocked", { amount: config.minAffection })
                          : blocked === "daily_limit"
                          ? t("coopLimit")
                          : t(`kinds.${kind}`)
                      }
                      className="relative flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-amber-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <span className="text-lg leading-none">{config.emoji}</span>
                      <span className="text-[9px] font-bold text-stone-600 leading-tight text-center px-0.5">
                        {t(`kinds.${kind}`)}
                      </span>
                      {blocked === "locked" ? (
                        <span className="absolute top-1 right-1 text-stone-400">
                          <Lock size={9} />
                        </span>
                      ) : (
                        <span className="absolute top-1 right-1 text-[8px] font-black text-stone-300">
                          {left}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-amber-200 shadow-md">
            <span className="text-sm leading-none">{visit.isHost ? "🏠" : "🚪"}</span>
            <span className="text-[11px] font-bold text-stone-700 max-w-[150px] truncate">
              {visit.isHost
                ? t("bannerHosting", { name: visit.partner.characterName })
                : t("bannerVisiting", { name: visit.partner.characterName })}
            </span>
            <button
              type="button"
              onClick={() => setIsDockOpen((open) => !open)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-full text-[10px] shadow-sm active:scale-95 transition-all"
            >
              {isDockOpen ? t("coopClose") : t("coopOpen")}
            </button>
            <button
              type="button"
              onClick={handleEnd}
              disabled={pending}
              aria-label={t("end")}
              title={t("end")}
              className="p-1.5 text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
            >
              <DoorOpen size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Map an action's error code to its message key, with a generic fallback. */
function errorKey(error: string): string {
  const known = ["locked", "daily_limit", "no_active_visit", "visits_closed"];
  return known.includes(error) ? `errors.${error}` : "errors.generic";
}
