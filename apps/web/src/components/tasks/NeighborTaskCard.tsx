"use client";

import React, { useState } from "react";
import { Copy, Heart, Clock, CheckCircle } from "lucide-react";
import type { Task } from "@/lib/types";

interface NeighborTaskCardProps {
  task: Task;
  ownerName: string;
  isMine?: boolean;
  onCopyTask?: (taskId: string) => Promise<void>;
  onSendVibe?: (neighborId: string) => Promise<void>;
}

export const NeighborTaskCard: React.FC<NeighborTaskCardProps> = ({
  task,
  ownerName,
  isMine = false,
  onCopyTask,
  onSendVibe,
}) => {
  const [copied, setCopied] = useState(false);
  const [vibeSent, setVibeSent] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [loadingVibe, setLoadingVibe] = useState(false);

  const handleCopy = async () => {
    if (!onCopyTask || loadingCopy || copied) return;
    setLoadingCopy(true);
    try {
      await onCopyTask(task.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } finally {
      setLoadingCopy(false);
    }
  };

  const handleVibe = async () => {
    if (!onSendVibe || loadingVibe || vibeSent) return;
    setLoadingVibe(true);
    try {
      await onSendVibe(task.userId);
      setVibeSent(true);
      setTimeout(() => setVibeSent(false), 3000);
    } finally {
      setLoadingVibe(false);
    }
  };

  const priorityColor =
    task.priority === "high"
      ? "bg-red-100 text-red-700 border-red-200"
      : task.priority === "medium"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <div
      className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 ${
        isMine
          ? "bg-sky-50/70 border-sky-200"
          : "bg-white/80 backdrop-blur-sm border-amber-100"
      }`}
    >
      {/* Header with owner info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${
              isMine
                ? "bg-sky-100 border-sky-300 text-sky-800"
                : "bg-emerald-100 border-emerald-300 text-emerald-800"
            }`}
          >
            {isMine ? "Tôi" : ownerName.substring(0, 1).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-stone-700 truncate max-w-[130px]">
            {isMine ? "Task của tôi" : ownerName}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColor}`}
        >
          {task.priority.toUpperCase()}
        </span>
      </div>

      {/* Task Content */}
      <div>
        <h4 className="font-semibold text-stone-800 text-sm line-clamp-2">
          {task.title}
        </h4>
        {task.notes && (
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
            {task.notes}
          </p>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
        <div className="flex items-center gap-1 text-stone-500 font-medium">
          <Clock size={13} className="text-amber-500" />
          <span>{task.focusDuration}m</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isMine && onSendVibe && (
            <button
              type="button"
              onClick={handleVibe}
              disabled={loadingVibe || vibeSent}
              className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-xs ${
                vibeSent
                  ? "bg-rose-100 text-rose-700 border-rose-300"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200"
              }`}
              title="Gửi lời cổ vũ"
            >
              <Heart size={13} className={vibeSent ? "fill-rose-500" : ""} />
              {vibeSent && <span className="text-[10px] font-bold">Đã gửi!</span>}
            </button>
          )}

          {!isMine && onCopyTask && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={loadingCopy || copied}
              className={`px-2.5 py-1 rounded-xl border font-semibold transition-all flex items-center gap-1.5 text-xs ${
                copied
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              <span>{copied ? "Đã chép" : "Sao chép"}</span>
            </button>
          )}

          {isMine && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full border border-sky-200">
              📌 Task của tôi
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
