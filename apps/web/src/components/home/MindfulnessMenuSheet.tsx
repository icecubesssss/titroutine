"use client";

import type { ActiveOverlay } from "./overlayTypes";

// Bottom sheet listing the mindfulness tools (mood check-in, box breathing,
// mental first aid). Copy is intentionally hardcoded Vietnamese, matching the
// original inline block in HomeView. Selecting a tool swaps the active overlay.
export function MindfulnessMenuSheet({
  open,
  setActiveOverlay,
}: {
  open: boolean;
  setActiveOverlay: (o: ActiveOverlay) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setActiveOverlay(null)}>
      <div
        className="w-full max-w-md rounded-3xl bg-theme-bg p-6 shadow-2xl border border-theme-card-border animate-sheet-up text-theme-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-theme-card-border pb-3">
          <h3 className="text-lg font-black flex items-center gap-2">
            🧘 Hộp Công Cụ Chánh Niệm
          </h3>
          <button onClick={() => setActiveOverlay(null)} className="text-theme-text/45 hover:text-theme-text/80 font-bold">✕</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setActiveOverlay("mood_checkin")}
            className="w-full text-left p-4 bg-theme-card-bg hover:bg-theme-accent-light border-2 border-theme-card-border rounded-2xl transition-all flex items-center gap-3 active:scale-98"
          >
            <span className="text-3xl">💭</span>
            <div>
              <div className="text-xs font-black">Báo cáo cảm xúc hằng ngày</div>
              <div className="text-[10px] text-theme-text/45 leading-tight">Nhìn nhận cảm xúc của bản thân và ghi chép biết ơn (+15 xu)</div>
            </div>
          </button>

          <button
            onClick={() => setActiveOverlay("breathing")}
            className="w-full text-left p-4 bg-theme-card-bg hover:bg-theme-accent-light border-2 border-theme-card-border rounded-2xl transition-all flex items-center gap-3 active:scale-98"
          >
            <span className="text-3xl">🌬️</span>
            <div>
              <div className="text-xs font-black">Luyện thở Box Breathing</div>
              <div className="text-[10px] text-theme-text/45 leading-tight">2 phút tập thở khoa học giúp xoa dịu stress tức thì (+10 xu)</div>
            </div>
          </button>

          <button
            onClick={() => setActiveOverlay("first_aid")}
            className="w-full text-left p-4 bg-theme-card-bg hover:bg-theme-accent-light border-2 border-theme-card-border rounded-2xl transition-all flex items-center gap-3 active:scale-98"
          >
            <span className="text-3xl">🚑</span>
            <div>
              <div className="text-xs font-black">Sơ cứu tâm lý khẩn cấp</div>
              <div className="text-[10px] text-theme-text/45 leading-tight">Kết nối giác quan, bóp bóng xả giận, thẻ đọc chữa lành</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
