"use client";

import React, { useEffect, useState } from "react";
import { X, Trash2, Calendar, Clock, User, Award } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import type { Task } from "@/lib/types";

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onCreateTask: (input: {
    title: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
    assigneeType?: "self" | "pet";
    focusDuration?: number;
    deadline?: string | null;
  }) => void;
  onUpdateTask: (
    taskId: string,
    input: {
      title?: string;
      notes?: string;
      priority?: "low" | "medium" | "high";
      assigneeType?: "self" | "pet";
      focusDuration?: number;
      deadline?: string | null;
    }
  ) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ 
  isOpen, 
  onClose, 
  task,
  onCreateTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const isEdit = Boolean(task);

  interface Subtask {
    id: string;
    text: string;
    completed: boolean;
  }

  const [title, setTitle] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [assigneeType, setAssigneeType] = useState<"self" | "pet">("self");
  const [focusDuration, setFocusDuration] = useState(25);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setAssigneeType(task.assigneeType);
      
      const durationPresets = [15, 25, 45, 60, 90];
      const isPreset = durationPresets.includes(task.focusDuration);
      setFocusDuration(task.focusDuration);
      setIsCustomDuration(!isPreset);
      
      setDeadline(task.deadline ? task.deadline.split("T")[0] : "");
      
      if (task.notes) {
        try {
          const parsed = JSON.parse(task.notes);
          if (Array.isArray(parsed)) {
            setSubtasks(parsed);
          } else {
            setSubtasks([{ id: "legacy", text: task.notes, completed: false }]);
          }
        } catch {
          setSubtasks([{ id: "legacy", text: task.notes, completed: false }]);
        }
      } else {
        setSubtasks([]);
      }
    } else {
      setTitle("");
      setSubtasks([]);
      setPriority("medium");
      setAssigneeType("self");
      setFocusDuration(25);
      setIsCustomDuration(false);
      setDeadline("");
    }
    setNewSubtaskText("");
    setConfirmDelete(false);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newSub: Subtask = {
      id: Math.random().toString(36).substring(2, 9),
      text: newSubtaskText.trim(),
      completed: false,
    };
    setSubtasks((prev) => [...prev, newSub]);
    setNewSubtaskText("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((sub) => sub.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const deadlineISO = deadline ? new Date(`${deadline}T12:00:00`).toISOString() : null;
    const notesJson = subtasks.length > 0 ? JSON.stringify(subtasks) : (isEdit ? "[]" : undefined);

    if (isEdit && task) {
      onUpdateTask(task.id, {
        title,
        notes: notesJson,
        priority,
        assigneeType,
        focusDuration,
        deadline: deadlineISO,
      });
    } else {
      onCreateTask({
        title,
        notes: notesJson,
        priority,
        assigneeType,
        focusDuration,
        deadline: deadlineISO,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteTask(task.id);
    onClose();
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

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#8b7355] uppercase tracking-wider">
              Nhiệm vụ con (Subtasks)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập nhiệm vụ con..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 bg-white border-2 border-[#ebdcc5] px-4 py-2.5 rounded-2xl text-sm font-bold text-[#5c4033] placeholder-stone-400 focus:outline-none focus:border-theme-accent transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-[#5c4033] hover:brightness-110 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all"
              >
                Thêm
              </button>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {subtasks.length === 0 ? (
                <p className="text-[11px] text-stone-400 font-semibold italic text-center py-3 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  Chưa có nhiệm vụ con nào.
                </p>
              ) : (
                subtasks.map((sub, index) => (
                  <div key={sub.id} className="flex items-center gap-2 bg-white border border-[#ebdcc5]/60 p-2 rounded-2xl">
                    <span className="text-[10px] text-stone-400 font-black w-4 text-center">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-xs font-bold text-[#5c4033] line-clamp-1">
                      {sub.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="p-1 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors"
                      title="Xóa nhiệm vụ con"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
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
                value={isCustomDuration ? "custom" : focusDuration}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setIsCustomDuration(true);
                  } else {
                    setIsCustomDuration(false);
                    setFocusDuration(Number(val));
                  }
                }}
                className="w-full bg-white border-2 border-[#ebdcc5] px-3 py-2.5 rounded-2xl text-sm font-bold text-[#5c4033] focus:outline-none focus:border-theme-accent"
              >
                <option value={15}>15 phút</option>
                <option value={25}>25 phút (Pomo)</option>
                <option value={45}>45 phút</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
                <option value="custom">Tự nhập phút...</option>
              </select>
              {isCustomDuration && (
                <div className="mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={focusDuration}
                    onChange={(e) => setFocusDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border-2 border-[#ebdcc5] px-3 py-2 rounded-2xl text-sm font-bold text-[#5c4033] focus:outline-none focus:border-theme-accent"
                    placeholder="Số phút..."
                  />
                  <span className="text-xs font-black text-[#5c4033] shrink-0">phút</span>
                </div>
              )}
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
              className="flex-1 bg-theme-accent text-white py-3 rounded-2xl font-bold text-sm shadow-sm"
            >
              {isEdit ? "Lưu thay đổi" : "Tạo công việc"}
            </DuoButton>
          </div>
        </form>
      </div>
    </div>
  );
};
