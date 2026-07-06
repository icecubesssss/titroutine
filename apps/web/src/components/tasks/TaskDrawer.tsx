"use client";

import React, { useEffect, useState, useTransition } from "react";
import { X, Trash2, Calendar, Clock, User, Award } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import { createTaskAction, updateTaskDetailsAction, deleteTaskAction } from "@/app/[locale]/actions";
import type { Task } from "@/lib/types";

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  task?: Task | null;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ isOpen, onClose, onSaved, task }) => {
  const isEdit = Boolean(task);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assigneeType, setAssigneeType] = useState<"self" | "pet">("self");
  const [focusDuration, setFocusDuration] = useState(25);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || "");
      setPriority(task.priority);
      setAssigneeType(task.assigneeType);
      setFocusDuration(task.focusDuration);
      setDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    } else {
      setTitle("");
      setNotes("");
      setPriority("medium");
      setAssigneeType("self");
      setFocusDuration(25);
      setDeadline("");
    }
    setError(null);
    setConfirmDelete(false);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      const deadlineISO = deadline ? new Date(`${deadline}T12:00:00`).toISOString() : null;

      const result = isEdit
        ? await updateTaskDetailsAction(task!.id, {
            title,
            notes,
            priority,
            assigneeType,
            focusDuration,
            deadline: deadlineISO,
          })
        : await createTaskAction({
            title,
            notes,
            priority,
            assigneeType,
            focusDuration,
            deadline: deadlineISO,
          });

      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved();
      onClose();
    });
  };

  const handleDelete = () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fdfaf6] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#ebdcc5] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-[#ebdcc5] bg-white sticky top-0 z-10">
          <h2 className="text-xl font-black text-[#5c4033] flex items-center gap-2">
            {isEdit ? "✏️ Sửa Công Việc" : "🌱 Thêm Công Việc Mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#fdfaf6]">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
              Lỗi: {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-black text-[#8b7355] uppercase tracking-wider">
              Tên công việc
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Hoàn thành báo cáo môn học..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border-2 border-[#ebdcc5] px-4 py-3 rounded-2xl text-sm font-bold text-[#5c4033] placeholder-stone-400 focus:outline-none focus:border-theme-accent transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-black text-[#8b7355] uppercase tracking-wider">
              Ghi chú thêm
            </label>
            <textarea
              placeholder="Mô tả các bước thực hiện hoặc tài liệu tham khảo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white border-2 border-[#ebdcc5] px-4 py-3 rounded-2xl text-sm font-bold text-[#5c4033] placeholder-stone-400 focus:outline-none focus:border-theme-accent transition-colors resize-none"
            />
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="assignee-select" className="text-xs font-black text-[#8b7355] uppercase tracking-wider flex items-center gap-1">
                <User size={12} /> Người làm
              </label>
              <select
                id="assignee-select"
                title="Người thực hiện công việc"
                value={assigneeType}
                onChange={(e) => setAssigneeType(e.target.value as "self" | "pet")}
                className="w-full bg-white border-2 border-[#ebdcc5] px-3 py-2.5 rounded-2xl text-sm font-bold text-[#5c4033] focus:outline-none focus:border-theme-accent"
              >
                <option value="self">Bản thân</option>
                <option value="pet">Thỏ cưng 🐰</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="priority-select" className="text-xs font-black text-[#8b7355] uppercase tracking-wider">
                Độ ưu tiên
              </label>
              <select
                id="priority-select"
                title="Độ ưu tiên công việc"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full bg-white border-2 border-[#ebdcc5] px-3 py-2.5 rounded-2xl text-sm font-bold text-[#5c4033] focus:outline-none focus:border-theme-accent"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>
          </div>

          {/* Focus Duration & Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="focus-select" className="text-xs font-black text-[#8b7355] uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Thời gian tập trung
              </label>
              <select
                id="focus-select"
                title="Thời gian tập trung dự kiến"
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                className="w-full bg-white border-2 border-[#ebdcc5] px-3 py-2.5 rounded-2xl text-sm font-bold text-[#5c4033] focus:outline-none focus:border-theme-accent"
              >
                <option value={15}>15 phút</option>
                <option value={25}>25 phút (Pomo)</option>
                <option value={45}>45 phút</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="deadline-input" className="text-xs font-black text-[#8b7355] uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Hạn chót
              </label>
              <input
                id="deadline-input"
                type="date"
                title="Hạn chót công việc"
                placeholder="Chọn ngày hạn chót"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white border-2 border-[#ebdcc5] px-3 py-2 rounded-2xl text-sm font-bold text-[#5c4033] focus:outline-none focus:border-theme-accent"
              />
            </div>
          </div>

          {/* Potential Reward Info */}
          <div className="bg-amber-50 border border-amber-200/50 p-3.5 rounded-2xl flex items-start gap-3 mt-2">
            <Award className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h5 className="text-[11px] font-black text-amber-800 uppercase tracking-wider">
                Phần thưởng hoàn thành
              </h5>
              <p className="text-[11px] font-semibold text-amber-900/70 mt-0.5 leading-snug">
                Nhận ngay <strong className="text-amber-800">+{focusDuration} Focus Tokens</strong> để mua sắm đồ tập trung &amp; <strong className="text-amber-800">+1 Cà rốt 🥕</strong> cho tủ đồ thỏ cưng!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className={`px-4 py-3 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  confirmDelete
                    ? "bg-red-500 border-red-500 text-white animate-pulse"
                    : "border-red-200 text-red-500 hover:bg-red-50"
                }`}
              >
                <Trash2 size={16} />
                {confirmDelete ? "Chắc chưa?" : "Xoá"}
              </button>
            )}
            <DuoButton
              type="submit"
              disabled={isPending}
              className="flex-1 bg-theme-accent text-white py-3 rounded-2xl font-bold text-sm shadow-sm"
            >
              {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo công việc"}
            </DuoButton>
          </div>
        </form>
      </div>
    </div>
  );
};
