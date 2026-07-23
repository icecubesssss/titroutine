"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, UserPlus, Home, Sparkles, Check, Copy, Flame, Heart, BookOpen, User } from "lucide-react";
import type { NeighborSummary, NeighborData, Task } from "@/lib/types";
import {
  getNeighborsListAction,
  getNeighborDataAction,
  copyNeighborTaskAction,
  sendVibeAction,
  addFriendAction,
} from "@/app/[locale]/actions";
import { NeighborTaskCard } from "@/components/tasks/NeighborTaskCard";
import { PandaGirlCompanion } from "@/components/pet/PandaGirlCompanion";

interface NeighborVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  myFriendCode: string;
  myTasks?: Task[];
}

export const NeighborVisitModal: React.FC<NeighborVisitModalProps> = ({
  isOpen,
  onClose,
  myFriendCode,
  myTasks = [],
}) => {
  const [neighbors, setNeighbors] = useState<NeighborSummary[]>([]);
  const [selectedNeighborId, setSelectedNeighborId] = useState<string | null>(null);
  const [neighborData, setNeighborData] = useState<NeighborData | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [addFriendSuccess, setAddFriendSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "habits">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "mine" | "neighbor">("all");
  const [pending, startTransition] = useTransition();

  // Load neighbor list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingList(true);
    getNeighborsListAction()
      .then((res) => {
        if (res.neighbors) {
          const list = res.neighbors;
          setNeighbors(list);
          if (list.length > 0) {
            setSelectedNeighborId((prev) => prev ?? list[0].id);
          }
        }
      })
      .finally(() => setLoadingList(false));
  }, [isOpen]);

  // Load selected neighbor details
  useEffect(() => {
    if (!selectedNeighborId) {
      setNeighborData(null);
      return;
    }
    setLoadingData(true);
    getNeighborDataAction(selectedNeighborId)
      .then((res) => {
        if (res.data) {
          setNeighborData(res.data);
        }
      })
      .finally(() => setLoadingData(false));
  }, [selectedNeighborId]);

  if (!isOpen) return null;

  const handleAddFriend = () => {
    const code = friendCodeInput.trim();
    if (!code) return;
    setAddFriendError(null);
    setAddFriendSuccess(null);
    startTransition(async () => {
      const res = await addFriendAction(code);
      if (res.error) {
        setAddFriendError(res.error === "friend_not_found" ? "Mã bạn không tồn tại!" : "Không thể kết bạn.");
      } else {
        setAddFriendSuccess("Đã thêm bạn thành công!");
        setFriendCodeInput("");
        // Refresh neighbor list
        const updated = await getNeighborsListAction();
        if (updated.neighbors) {
          setNeighbors(updated.neighbors);
          setSelectedNeighborId(code);
        }
      }
    });
  };

  const handleCopyMyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTask = async (taskId: string) => {
    await copyNeighborTaskAction(taskId);
  };

  const handleSendVibe = async (neighborId: string) => {
    await sendVibeAction(neighborId, "cheer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-amber-50/95 border border-amber-200 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-white/80 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Home size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                Ghé Thăm Hàng Xóm
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Phase 2
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Khám phá nhà bạn bè, tham khảo task & cổ vũ cùng học tập!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-100 text-stone-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Bar: My Code & Add Friend */}
          <div className="bg-white/90 border border-amber-200/70 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="font-semibold text-stone-700">Mã bạn của tôi:</span>
              <code className="bg-amber-100/70 text-amber-900 px-2 py-1 rounded-lg font-mono text-[11px] font-bold">
                {myFriendCode.substring(0, 8)}...
              </code>
              <button
                type="button"
                onClick={handleCopyMyCode}
                className="p-1 hover:bg-amber-100 rounded-lg text-amber-800 transition-colors"
                title="Sao chép mã"
              >
                {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Nhập ID/Mã bạn bè..."
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleAddFriend}
                disabled={pending || !friendCodeInput.trim()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
              >
                <UserPlus size={14} />
                <span>Kết bạn</span>
              </button>
            </div>

            {addFriendError && (
              <span className="w-full text-xs font-semibold text-red-600">{addFriendError}</span>
            )}
            {addFriendSuccess && (
              <span className="w-full text-xs font-semibold text-emerald-600">{addFriendSuccess}</span>
            )}
          </div>

          {/* Neighbor Selector Tabs */}
          {loadingList ? (
            <div className="text-xs text-stone-400 font-medium py-1 animate-pulse">
              Đang tải danh sách hàng xóm...
            </div>
          ) : neighbors.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {neighbors.map((n) => {
                const isSelected = n.id === selectedNeighborId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedNeighborId(n.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-600 shadow-md scale-105"
                        : "bg-white/80 hover:bg-white text-stone-700 border-amber-200/80"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isSelected ? "bg-white text-amber-600" : "bg-amber-100 text-amber-800"}`}>
                      {n.username ? n.username[0].toUpperCase() : "N"}
                    </div>
                    <span>{n.username}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800"}`}>
                      🔥 {n.currentStreak}d
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Neighbor Room Details & View */}
          {loadingData ? (
            <div className="h-48 flex items-center justify-center text-stone-400 text-sm">
              Đang tải căn phòng hàng xóm...
            </div>
          ) : neighborData ? (
            <div className="space-y-4">
              {/* Cozy Room & Pet Banner */}
              <div className="relative bg-gradient-to-br from-amber-100/90 via-orange-50 to-amber-200/70 border border-amber-300/80 rounded-3xl p-5 overflow-hidden shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="z-10 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-lg font-extrabold text-stone-800">
                      Căn phòng của {neighborData.profile.username}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="bg-white/90 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Flame size={13} className="text-amber-500" />
                      Chuỗi {neighborData.profile.currentStreak} ngày
                    </span>
                    <span className="bg-white/90 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full shadow-sm">
                      Cấp {neighborData.profile.petLevel}
                    </span>
                    <span className="bg-white/90 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Heart size={13} className="text-rose-500 fill-rose-500" />
                      Thân thiết {neighborData.profile.affection}%
                    </span>
                  </div>
                </div>

                {/* Panda Girl Companion Sprite View */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-28 h-28 flex items-center justify-center bg-white/40 rounded-full border border-amber-200 backdrop-blur-xs p-2">
                    <PandaGirlCompanion action="idle" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendVibe(neighborData.profile.id)}
                    className="mt-2 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Cổ vũ ✨</span>
                  </button>
                </div>
              </div>

              {/* Public Tasks / Habits Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("tasks")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "tasks"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white/80 text-stone-600 hover:bg-white"
                      }`}
                    >
                      <BookOpen size={14} />
                      <span>Task ({neighborData.publicTasks.length + myTasks.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("habits")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "habits"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white/80 text-stone-600 hover:bg-white"
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>Thói quen ({neighborData.publicHabits.length})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Filter bar for Tasks tab */}
                {activeTab === "tasks" && (() => {
                  const hostTasks = neighborData.publicTasks;
                  const hostName = neighborData.profile.username || "Hàng xóm";
                  const myTasksList = myTasks;
                  const displayedTasks =
                    taskFilter === "mine"
                      ? myTasksList
                      : taskFilter === "neighbor"
                      ? hostTasks
                      : [...hostTasks, ...myTasksList.filter((mt) => !hostTasks.some((ht) => ht.id === mt.id))];

                  return (
                    <div className="space-y-3">
                      {/* Filter pill controls */}
                      <div className="flex items-center gap-1.5 pb-1 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setTaskFilter("all")}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                            taskFilter === "all"
                              ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                              : "bg-white/90 text-stone-600 border-amber-200 hover:bg-white"
                          }`}
                        >
                          <span>🌟 Tất cả task</span>
                          <span className="text-[10px] opacity-80">({hostTasks.length + myTasksList.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskFilter("mine")}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                            taskFilter === "mine"
                              ? "bg-sky-600 text-white border-sky-700 shadow-sm"
                              : "bg-white/90 text-stone-600 border-amber-200 hover:bg-white"
                          }`}
                        >
                          <span>👤 Task của mình</span>
                          <span className="text-[10px] opacity-80">({myTasksList.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskFilter("neighbor")}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                            taskFilter === "neighbor"
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                              : "bg-white/90 text-stone-600 border-amber-200 hover:bg-white"
                          }`}
                        >
                          <span>🏠 Task của {hostName}</span>
                          <span className="text-[10px] opacity-80">({hostTasks.length})</span>
                        </button>
                      </div>

                      {/* Filtered Tasks Grid */}
                      {displayedTasks.length === 0 ? (
                        <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-amber-200 text-stone-400 text-xs">
                          {taskFilter === "mine"
                            ? "Bạn chưa có task nào!"
                            : taskFilter === "neighbor"
                            ? `${hostName} chưa công khai task nào!`
                            : "Không có task nào để hiển thị!"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {displayedTasks.map((t) => {
                            const isMine = t.userId === myFriendCode || !hostTasks.some((ht) => ht.id === t.id && ht.userId !== myFriendCode);
                            return (
                              <NeighborTaskCard
                                key={t.id}
                                task={t}
                                ownerName={isMine ? "Tôi" : hostName}
                                isMine={isMine}
                                onCopyTask={handleCopyTask}
                                onSendVibe={handleSendVibe}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Habits List */}
                {activeTab === "habits" && (
                  <div>
                    {neighborData.publicHabits.length === 0 ? (
                      <div className="p-8 text-center bg-white/60 rounded-2xl border border-dashed border-amber-200 text-stone-400 text-xs">
                        Hàng xóm chưa chia sẻ thói quen nào.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {neighborData.publicHabits.map((h) => (
                          <div
                            key={h.id}
                            className="bg-white/90 border border-amber-100 rounded-2xl p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                              <span className="font-semibold text-stone-800 text-xs">
                                {h.title}
                              </span>
                              <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full border border-stone-200">
                                {h.type}
                              </span>
                            </div>
                            <span className="text-xs text-stone-500 font-medium">
                              🌐 Public
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white/60 rounded-3xl border border-dashed border-amber-300 text-stone-500 space-y-2">
              <User size={32} className="mx-auto text-amber-400" />
              <p className="font-bold text-sm text-stone-700">Chưa có danh sách hàng xóm</p>
              <p className="text-xs text-stone-500">
                Hãy nhập mã bạn bè ở trên để kết bạn và ghé thăm nhà bạn bè nhé!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
