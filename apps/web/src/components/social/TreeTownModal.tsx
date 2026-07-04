"use client";

import React, { useState, useTransition } from "react";
import { X, UserPlus, Copy, Check } from "lucide-react";
import { addFriendAction, sendVibeAction } from "@/app/[locale]/actions";
import { useRouter } from "next/navigation";

interface TreeTownModalProps {
  isOpen: boolean;
  onClose: () => void;
  myFriendCode: string;
}

// Mock neighbors to make the town feel alive immediately
const MOCK_NEIGHBORS = [
  { id: "mock_mochi", username: "Mochi 🍡", stage: 2, vibeSent: false },
  { id: "mock_biscuit", username: "Biscuit 🍪", stage: 5, vibeSent: false },
  { id: "mock_pancake", username: "Pancake 🥞", stage: 6, vibeSent: false }
];

export const TreeTownModal: React.FC<TreeTownModalProps> = ({
  isOpen,
  onClose,
  myFriendCode,
}) => {
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFriendForVibe, setSelectedFriendForVibe] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // State to track vibe clicks locally for mock neighborhood
  const [localNeighbors, setLocalNeighbors] = useState(MOCK_NEIGHBORS);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriend = () => {
    const code = friendCodeInput.trim();
    if (!code) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addFriendAction(code);
      if (res.error) {
        setError(res.error === "friend_not_found" ? "Không tìm thấy mã bạn bè này!" : "Lỗi thêm bạn bè.");
      } else {
        setSuccess("Đã thêm bạn hàng xóm mới thành công! 🏡");
        setFriendCodeInput("");
        router.refresh();
      }
    });
  };

  const handleSendVibe = (friendId: string, vibeType: string) => {
    setSelectedFriendForVibe(null);
    setError(null);
    setSuccess(null);
    
    // Nếu là mock
    if (friendId.startsWith("mock_")) {
      setLocalNeighbors(prev =>
        prev.map(n => n.id === friendId ? { ...n, vibeSent: true } : n)
      );
      setSuccess("Đã gửi những rung cảm ấm áp tới bạn ấy! 🫂");
      return;
    }

    startTransition(async () => {
      const res = await sendVibeAction(friendId, vibeType);
      if (res.error) {
        setError("Không thể gửi vibe lúc này.");
      } else {
        setSuccess("Đã gửi vibe thành công! 🌟");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#fdfaf6] rounded-3xl shadow-2xl border-4 border-[#ebdcc5] overflow-hidden flex flex-col max-h-[85vh] animate-sheet-up text-[#5c4033]">
        
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b border-orange-100 bg-white">
          <h2 className="text-lg font-black text-[#5c4033] flex items-center gap-1.5">
            🏡 Khu Phố Bạn Bè (Tree Town)
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-500 font-bold">{error}</div>}
          {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 font-bold">{success}</div>}

          {/* Copy My Code */}
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-black uppercase text-gray-400">Mã Hàng Xóm của bạn</h3>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={myFriendCode}
                aria-label="Mã bạn bè của bạn"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono font-bold select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all shadow-sm shadow-orange-100"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Đã chép" : "Sao chép"}
              </button>
            </div>
          </div>

          {/* Add Friend Input */}
          <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-black uppercase text-gray-400">Thêm Hàng Xóm</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                placeholder="Nhập mã hàng xóm..."
                aria-label="Mã bạn bè hàng xóm cần thêm"
                className="flex-1 border border-[#ebdcc5] rounded-xl px-3 py-2 text-xs placeholder-gray-400 focus:border-orange-400 focus:outline-none transition-colors"
              />
              <button
                type="button"
                disabled={pending || !friendCodeInput.trim()}
                onClick={handleAddFriend}
                className="bg-orange-100 hover:bg-orange-200 disabled:opacity-50 text-orange-700 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 transition-colors"
              >
                <UserPlus size={14} /> Thêm
              </button>
            </div>
          </div>

          {/* Neighbor list */}
          <div>
            <h3 className="text-xs font-black uppercase text-gray-400 mb-3">Hàng Xóm Trong Phố</h3>
            <div className="grid grid-cols-1 gap-3">
              {localNeighbors.map((neighbor) => (
                <div
                  key={neighbor.id}
                  className="bg-white rounded-2xl border border-[#ebdcc5] p-4 flex justify-between items-center shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none">🐰</span>
                    <div>
                      <h4 className="font-bold text-xs">{neighbor.username}</h4>
                      <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider">
                        Thỏ Cấp {neighbor.stage}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    {neighbor.vibeSent ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-0.5 animate-fade-in">
                        ❤️ Đã gửi vibe
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedFriendForVibe(neighbor.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm transition-colors active:scale-95 flex items-center gap-1"
                      >
                        🫂 Gửi Vibe
                      </button>
                    )}

                    {/* Vibe Selection Dropdown */}
                    {selectedFriendForVibe === neighbor.id && (
                      <div className="absolute right-0 bottom-full mb-2 bg-white border border-[#ebdcc5] rounded-2xl shadow-xl p-2.5 flex flex-col gap-1.5 z-20 w-36 animate-scale-up">
                        <span className="text-[9px] font-black text-gray-400 text-center uppercase tracking-wider block border-b pb-1 mb-1 border-stone-100">Chọn rung cảm</span>
                        <button
                          onClick={() => handleSendVibe(neighbor.id, "hug")}
                          className="text-left text-xs font-bold py-1 px-2 rounded-lg hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1 transition-colors"
                        >
                          🫂 Ôm ấm áp
                        </button>
                        <button
                          onClick={() => handleSendVibe(neighbor.id, "water")}
                          className="text-left text-xs font-bold py-1 px-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                          💧 Nhắc uống nước
                        </button>
                        <button
                          onClick={() => handleSendVibe(neighbor.id, "cheer")}
                          className="text-left text-xs font-bold py-1 px-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 flex items-center gap-1 transition-colors"
                        >
                          🎉 Cổ vũ cố lên
                        </button>
                        <button
                          onClick={() => setSelectedFriendForVibe(null)}
                          className="text-center text-[9px] font-black text-stone-400 hover:text-stone-600 mt-1 border-t pt-1 border-stone-100"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
