"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, X, Send, ChevronLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getFeedbackStatusAction,
  getFeedbackInboxAction,
  getFeedbackThreadAction,
  sendFeedbackAction,
  markFeedbackReadAction,
} from "@/app/[locale]/actions";
import type { FeedbackMessage, FeedbackThreadSummary } from "@/lib/types";

// Realtime pushes new messages instantly; polling is only a fallback in case the
// realtime publication isn't set up (or the socket drops).
const POLL_OPEN_MS = 8_000;
const POLL_CLOSED_MS = 60_000;

interface FeedbackChatProps {
  userId: string;
}

/**
 * Floating "chat with the developer" widget. Regular users get a single
 * conversation; admins (migration 15 `app_admins`) get an inbox of every
 * user's conversation and reply from the same panel.
 */
export const FeedbackChat: React.FC<FeedbackChatProps> = ({ userId }) => {
  const t = useTranslations("Feedback");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unread, setUnread] = useState(0);
  const [threads, setThreads] = useState<FeedbackThreadSummary[]>([]);
  /** Admin only: whose conversation is open (null = inbox). */
  const [adminThread, setAdminThread] = useState<FeedbackThreadSummary | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const refreshStatus = useCallback(async () => {
    const res = await getFeedbackStatusAction();
    if (res.error) return;
    setIsAdmin(Boolean(res.isAdmin));
    setUnread(res.unread ?? 0);
  }, []);

  // Which conversation the panel is showing: own thread (user) or the picked one (admin).
  const threadUserId = isAdmin ? adminThread?.userId : undefined;
  const showingInbox = isAdmin && !adminThread;

  const refreshOpenView = useCallback(async () => {
    if (showingInbox) {
      const res = await getFeedbackInboxAction();
      if (res.threads) setThreads(res.threads);
      return;
    }
    const res = await getFeedbackThreadAction(threadUserId);
    if (res.messages) setMessages(res.messages);
    await markFeedbackReadAction(threadUserId);
    await refreshStatus();
  }, [showingInbox, threadUserId, refreshStatus]);

  // Unread badge on load + slow poll while closed, faster while open.
  useEffect(() => {
    refreshStatus();
    const id = setInterval(open ? refreshOpenView : refreshStatus, open ? POLL_OPEN_MS : POLL_CLOSED_MS);
    return () => clearInterval(id);
  }, [open, refreshStatus, refreshOpenView]);

  useEffect(() => {
    if (open) refreshOpenView();
  }, [open, refreshOpenView]);

  // Realtime: RLS already limits events to rows this user may read.
  const onChangeRef = useRef<() => void>(() => {});
  onChangeRef.current = () => (open ? refreshOpenView() : refreshStatus());
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`feedback-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "feedback_messages",
          ...(isAdmin ? {} : { filter: `thread_user_id=eq.${userId}` }),
        },
        () => onChangeRef.current()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const res = await sendFeedbackAction(text, threadUserId);
    setSending(false);
    if (res.error) {
      setError(res.error === "too_long" ? t("tooLong") : t("sendError"));
      return;
    }
    setDraft("");
    await refreshOpenView();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

  if (!mounted) return null;

  return createPortal(
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("open")}
          title={t("open")}
          className="fixed z-40 bottom-24 left-4 md:bottom-6 md:left-auto md:right-28 w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center active:scale-95 transition-all"
        >
          <MessageCircle size={22} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 border-2 border-white text-[10px] font-black flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <>
          {/* Mobile: dim the page behind the bottom sheet */}
          <div className="fixed inset-0 z-[60] bg-black/30 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed z-[61] inset-x-0 bottom-0 h-[85dvh] md:inset-x-auto md:bottom-6 md:right-6 md:w-96 md:h-[34rem] bg-[#fdfaf6] rounded-t-3xl md:rounded-3xl border-2 border-[#ebdcc5] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="shrink-0 px-4 py-3 bg-white border-b-2 border-[#ebdcc5] flex items-center gap-2">
              {isAdmin && adminThread && (
                <button
                  type="button"
                  onClick={() => { setAdminThread(null); setMessages([]); }}
                  aria-label={t("back")}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-[#5c4033] truncate">
                  {showingInbox
                    ? t("inboxTitle")
                    : adminThread
                    ? adminThread.username || t("anonymous")
                    : t("title")}
                </h2>
                <p className="text-[11px] text-stone-500 truncate">
                  {showingInbox ? t("inboxSubtitle") : adminThread ? t("adminReplying") : t("subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500"
              >
                <X size={16} />
              </button>
            </div>

            {showingInbox ? (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
                {threads.length === 0 ? (
                  <p className="text-center text-xs text-stone-400 py-10">{t("inboxEmpty")}</p>
                ) : (
                  threads.map((th) => (
                    <button
                      key={th.userId}
                      type="button"
                      onClick={() => setAdminThread(th)}
                      className="w-full text-left bg-white border border-[#ebdcc5] rounded-2xl p-3 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#5c4033] truncate">
                          {th.username || t("anonymous")}
                        </span>
                        <span className="shrink-0 text-[10px] text-stone-400">{formatTime(th.lastAt)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-stone-500 truncate">{th.lastBody}</span>
                        {th.unread > 0 && (
                          <span className="shrink-0 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                            {th.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-center text-xs text-stone-400 py-10 px-6 leading-relaxed">
                      {isAdmin ? t("threadEmpty") : t("welcome")}
                    </p>
                  ) : (
                    messages.map((m) => {
                      // "Mine" = sent from the side the viewer is on.
                      const mine = isAdmin && adminThread ? m.fromAdmin : !m.fromAdmin;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                              mine
                                ? "bg-amber-500 text-white rounded-br-md"
                                : "bg-white border border-[#ebdcc5] text-[#5c4033] rounded-bl-md"
                            }`}
                          >
                            {!mine && m.fromAdmin && (
                              <div className="text-[10px] font-black text-amber-700 mb-0.5">{t("developer")}</div>
                            )}
                            {m.body}
                            <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-stone-400"}`}>
                              {formatTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="shrink-0 p-3 bg-white border-t-2 border-[#ebdcc5] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {error && <p className="text-[11px] font-semibold text-red-600 mb-1">{error}</p>}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      maxLength={2000}
                      placeholder={t("placeholder")}
                      className="flex-1 resize-none max-h-28 bg-[#fdfaf6] border-2 border-[#ebdcc5] px-3 py-2 rounded-2xl text-sm text-[#5c4033] placeholder-stone-400 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      aria-label={t("send")}
                      className="shrink-0 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center disabled:opacity-40 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>,
    document.body
  );
};
