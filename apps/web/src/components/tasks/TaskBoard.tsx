"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable, useDraggable } from "@dnd-kit/core";
import { Plus, Play, CheckCircle2, User, Clock, Calendar, ArrowLeft, Edit2, X, CalendarDays, LayoutGrid, ChevronRight, Check, Sparkles } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import type { Task } from "@/lib/types";
import { updateTaskStatusAction, updateTaskDetailsAction, createTaskAction, deleteTaskAction } from "@/app/[locale]/actions";
import { useSound } from "@/hooks/useSound";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TimerModal } from "@/components/home/TimerModal";
import { TaskDrawer } from "./TaskDrawer";

// ── Toast ────────────────────────────────────────────────────────────────────
interface ToastData {
  id: number;
  message: string;
}

const Toast: React.FC<{ toast: ToastData; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg">
      <span className="flex-1">{toast.message}</span>
      <button 
        type="button" 
        onClick={() => onDismiss(toast.id)} 
        className="p-0.5 hover:bg-red-100 rounded-full transition-colors"
        title="Đóng"
        aria-label="Đóng"
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ── TaskBoard ────────────────────────────────────────────────────────────────
interface TaskBoardProps {
  tasks: Task[];
  onRefresh: () => void;
  /** Selected week bounds (YYYY-MM-DD). Tasks are filtered by deadline against
   *  this range; tasks with no deadline always show. Omit to show everything. */
  weekStart?: string;
  weekEnd?: string;
  weekDates?: string[];
  currentDate?: string;
  defaultTaskView?: "kanban" | "calendar";
  onSelectDate?: (dateStr: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks: serverTasks,
  onRefresh,
  weekStart,
  weekEnd,
  weekDates,
  currentDate,
  defaultTaskView = "kanban",
  onSelectDate,
}) => {
  const { playPop } = useSound();
  const isMobile = useIsMobile();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultNewDeadline, setDefaultNewDeadline] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">(defaultTaskView);
  // The task a focus countdown is currently running for (phone-only ritual).
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  useEffect(() => {
    if (defaultTaskView) setViewMode(defaultTaskView);
  }, [defaultTaskView]);

  // Optimistic tasks state
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>(serverTasks);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastCounter = useRef(0);

  // Sync with server updates
  useEffect(() => {
    setOptimisticTasks(serverTasks);
  }, [serverTasks]);

  const addToast = useCallback((message: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev.slice(-2), { id, message }]); // keep max 3
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Tasks created optimistically carry a "temp_" id until the server row comes
  // back; acting on that id server-side would fail (not a valid UUID).
  const isTempTask = useCallback((taskId: string) => {
    if (taskId.startsWith("temp_")) {
      addToast("Công việc đang được tạo, đợi một chút rồi thử lại nhé!");
      return true;
    }
    return false;
  }, [addToast]);

  // 1. Move Status Optimistic Handler
  const moveTask = useCallback(async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    if (isTempTask(taskId)) return;
    const original = optimisticTasks.find((t) => t.id === taskId);
    if (!original || original.status === newStatus) return;

    playPop();

    // Optimistic: move instantly without spinner
    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );

    // Starting a task (todo → đang làm) opens the strict focus timer on phones.
    // Finishing the countdown only ends the session — the task stays "đang làm".
    if (isMobile && original.status === "todo" && newStatus === "in_progress") {
      setFocusTask(original);
    }

    const result = await updateTaskStatusAction(taskId, newStatus);
    if (result?.error) {
      // Rollback
      setOptimisticTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: original.status, updatedAt: original.updatedAt } : t))
      );
      addToast(`Lỗi chuyển cột: ${result.error}`);
    }
    onRefresh();
  }, [optimisticTasks, playPop, addToast, onRefresh, isTempTask, isMobile]);

  // 2. Update Subtasks Optimistic Handler
  const updateTaskNotes = useCallback(async (taskId: string, notesJson: string) => {
    if (isTempTask(taskId)) return;
    const original = optimisticTasks.find((t) => t.id === taskId);
    if (!original) return;

    // Optimistic details update
    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, notes: notesJson } : t))
    );

    const result = await updateTaskDetailsAction(taskId, { notes: notesJson });
    if (result?.error) {
      // Rollback
      setOptimisticTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, notes: original.notes } : t))
      );
      addToast(`Lỗi cập nhật subtask: ${result.error}`);
    }
    onRefresh();
  }, [optimisticTasks, addToast, onRefresh, isTempTask]);

  // 3. Create Task Optimistic Handler
  const handleCreateTask = useCallback(async (input: {
    title: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
    assigneeType?: "self" | "pet";
    focusDuration?: number;
    deadline?: string | null;
  }) => {
    const tempId = "temp_" + Math.random().toString(36).substring(2, 9);
    const optTask: Task = {
      id: tempId,
      userId: "temp",
      title: input.title,
      notes: input.notes ?? null,
      status: "todo",
      priority: input.priority ?? "medium",
      assigneeType: input.assigneeType ?? "self",
      focusDuration: input.focusDuration ?? 25,
      deadline: input.deadline ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert task instantly into client list
    setOptimisticTasks((prev) => [...prev, optTask]);

    const result = await createTaskAction({
      title: input.title,
      notes: input.notes,
      priority: input.priority ?? "medium",
      assigneeType: input.assigneeType ?? "self",
      focusDuration: input.focusDuration ?? 25,
      deadline: input.deadline,
    });
    if (result?.error) {
      // Remove temp task on failure
      setOptimisticTasks((prev) => prev.filter((t) => t.id !== tempId));
      addToast(`Lỗi tạo công việc: ${result.error}`);
    }
    onRefresh();
  }, [addToast, onRefresh]);

  // 4. Update Task Details Optimistic Handler
  const handleUpdateTask = useCallback(async (taskId: string, input: {
    title?: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
    assigneeType?: "self" | "pet";
    focusDuration?: number;
    deadline?: string | null;
  }) => {
    if (isTempTask(taskId)) return;
    const original = optimisticTasks.find((t) => t.id === taskId);
    if (!original) return;

    // Apply updates instantly
    setOptimisticTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...input } : t))
    );

    const result = await updateTaskDetailsAction(taskId, input);
    if (result?.error) {
      // Rollback details
      setOptimisticTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...original } : t))
      );
      addToast(`Lỗi cập nhật chi tiết: ${result.error}`);
    }
    onRefresh();
  }, [optimisticTasks, addToast, onRefresh, isTempTask]);

  // 5. Delete Task Optimistic Handler
  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (isTempTask(taskId)) return;
    const original = optimisticTasks.find((t) => t.id === taskId);
    if (!original) return;

    // Remove instantly from list
    setOptimisticTasks((prev) => prev.filter((t) => t.id !== taskId));

    const result = await deleteTaskAction(taskId);
    if (result?.error) {
      // Recover task on failure
      setOptimisticTasks((prev) => [...prev, original]);
      addToast(`Lỗi xóa công việc: ${result.error}`);
    }
    onRefresh();
  }, [optimisticTasks, addToast, onRefresh, isTempTask]);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as "todo" | "in_progress" | "done";
    await moveTask(taskId, newStatus);
  };

  const columns: { id: "todo" | "in_progress" | "done"; title: string; bg: string; border: string; text: string; icon: string }[] = [
    { id: "todo", title: "Cần làm", bg: "bg-stone-50/70", border: "border-stone-200/50", text: "text-stone-700", icon: "📝" },
    { id: "in_progress", title: "Đang làm", bg: "bg-orange-50/70", border: "border-orange-200/50", text: "text-orange-700", icon: "🌱" },
    { id: "done", title: "Đã hoàn thành", bg: "bg-emerald-50/70", border: "border-emerald-200/50", text: "text-emerald-700", icon: "✨" },
  ];

  const calendarDates = useMemo(() => {
    if (weekDates && weekDates.length === 7) return weekDates;
    const base = currentDate ? parseISO(currentDate) : new Date();
    const day = base.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const mon = addDays(base, diffToMon);
    return Array.from({ length: 7 }, (_, i) => format(addDays(mon, i), "yyyy-MM-dd"));
  }, [weekDates, currentDate]);

  const WEEK_DAYS_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

  const unscheduledTasks = useMemo(() => {
    return optimisticTasks.filter((t) => !t.deadline && t.status !== "done");
  }, [optimisticTasks]);

  return (
    <div className="space-y-6 select-none h-full flex flex-col relative">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-theme-text flex items-center gap-2">
            📋 Bảng Công Việc
          </h2>
          {/* View mode toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-full border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => { playPop(); setViewMode("kanban"); }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "kanban"
                  ? "bg-white text-stone-800 shadow-xs"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => { playPop(); setViewMode("calendar"); }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "calendar"
                  ? "bg-white text-stone-800 shadow-xs"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <CalendarDays size={13} /> Lịch tuần
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setDefaultNewDeadline(null);
            setIsDrawerOpen(true);
          }}
          className="bg-theme-accent hover:brightness-105 text-white font-bold text-xs px-3.5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} strokeWidth={2.5} /> Thêm việc
        </button>
      </div>

      {viewMode === "calendar" ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Week Columns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {calendarDates.map((dateStr, idx) => {
              const isToday = dateStr === (currentDate || format(new Date(), "yyyy-MM-dd"));
              const dayTasks = optimisticTasks.filter(
                (t) => t.deadline && t.deadline.slice(0, 10) === dateStr
              );
              const doneCount = dayTasks.filter((t) => t.status === "done").length;

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl border-2 p-3 min-h-[220px] flex flex-col transition-all ${
                    isToday
                      ? "bg-amber-50/70 border-amber-300 shadow-xs"
                      : "bg-white/95 border-[#ebdcc5]"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-theme-accent">
                        {WEEK_DAYS_NAMES[idx]}
                      </span>
                      <span className="text-[11px] font-bold text-stone-500">
                        {format(parseISO(dateStr), "dd/MM")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-black text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full">
                          {doneCount}/{dayTasks.length}
                        </span>
                      )}
                      <button
                        type="button"
                        title={`Thêm việc vào ${WEEK_DAYS_NAMES[idx]}`}
                        onClick={() => {
                          setEditingTask(null);
                          setDefaultNewDeadline(dateStr);
                          setIsDrawerOpen(true);
                        }}
                        className="w-5 h-5 rounded-full bg-theme-accent-light text-theme-accent hover:bg-theme-accent hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-0.5">
                    {dayTasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-6 text-stone-300">
                        <span className="text-[11px] font-semibold">Chưa có việc</span>
                      </div>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-2 rounded-xl border transition-all text-xs flex flex-col gap-1.5 shadow-2xs ${
                            task.status === "done"
                              ? "bg-emerald-50/50 border-emerald-200 opacity-60"
                              : task.status === "in_progress"
                              ? "bg-orange-50/80 border-orange-200"
                              : "bg-white border-stone-200 hover:border-theme-accent/60"
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                moveTask(task.id, task.status === "done" ? "todo" : "done")
                              }
                              className={`w-4 h-4 rounded-md mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
                                task.status === "done"
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "bg-white border-stone-300 hover:border-theme-accent"
                              }`}
                            >
                              {task.status === "done" && <Check size={11} strokeWidth={3} />}
                            </button>
                            <span
                              onClick={() => {
                                setEditingTask(task);
                                setDefaultNewDeadline(null);
                                setIsDrawerOpen(true);
                              }}
                              className={`flex-1 font-bold cursor-pointer text-stone-800 leading-snug line-clamp-2 ${
                                task.status === "done" ? "line-through text-stone-400" : ""
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock size={10} /> {task.focusDuration}m
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full font-bold ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-600"
                                  : task.priority === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {task.priority === "high"
                                ? "Cao"
                                : task.priority === "medium"
                                ? "Vừa"
                                : "Thấp"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unscheduled Backlog Section */}
          {unscheduledTasks.length > 0 && (
            <div className="bg-stone-50 border-2 border-stone-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  📋 Việc chưa xếp lịch ({unscheduledTasks.length})
                </h4>
                <span className="text-[11px] text-stone-400">
                  Gán ngày nhanh để đưa vào lịch tuần
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {unscheduledTasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white border border-stone-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => moveTask(t.id, "done")}
                        className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center border border-stone-300 hover:border-theme-accent"
                      >
                      </button>
                      <span className="font-bold text-stone-700 truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const todayStr = format(new Date(), "yyyy-MM-dd");
                          handleUpdateTask(t.id, { deadline: todayStr });
                        }}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(t);
                          setDefaultNewDeadline(null);
                          setIsDrawerOpen(true);
                        }}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                      >
                        Sửa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Kanban Grid */
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
            {columns.map((col) => {
              // Week filter: keep tasks whose deadline falls in the selected week;
              // tasks without a deadline always show. In the "done" column, put the
              // most recently completed on top (updated_at bumps on status change).
              const colTasks = optimisticTasks
                .filter((t) => {
                  if (t.status !== col.id) return false;
                  if (!t.deadline || !weekStart || !weekEnd) return true;
                  const due = t.deadline.slice(0, 10);
                  return due >= weekStart && due <= weekEnd;
                })
                .sort((a, b) =>
                  col.id === "done" ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt) : 0
                );
              return (
                <Column
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  bg={col.bg}
                  border={col.border}
                  text={col.text}
                  icon={col.icon}
                  tasks={colTasks}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setDefaultNewDeadline(null);
                    setIsDrawerOpen(true);
                  }}
                  onMove={moveTask}
                  onUpdateNotes={updateTaskNotes}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[90vw] max-w-sm">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}

      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDefaultNewDeadline(null);
        }}
        task={editingTask}
        defaultDeadline={defaultNewDeadline}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Focus countdown for a task in progress. onComplete just closes it —
          the task keeps its "đang làm" status (no auto-done, no reward). */}
      {focusTask && (
        <TimerModal
          title={focusTask.title}
          durationSeconds={focusTask.focusDuration * 60}
          onClose={() => setFocusTask(null)}
          onComplete={() => setFocusTask(null)}
        />
      )}
    </div>
  );
};

// ── Column ───────────────────────────────────────────────────────────────────
interface ColumnProps {
  id: "todo" | "in_progress" | "done";
  title: string;
  bg: string;
  border: string;
  text: string;
  icon: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onMove: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
  onUpdateNotes: (taskId: string, notesJson: string) => Promise<void>;
}

const Column: React.FC<ColumnProps> = ({ id, title, bg, border, text, icon, tasks, onEdit, onMove, onUpdateNotes }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[28px] border-2 p-4 min-h-[400px] flex flex-col transition-all duration-200 ${bg} ${border} ${
        isOver ? "bg-theme-accent-light/10 border-theme-accent/30 scale-[1.01]" : ""
      }`}
    >
      {/* Title & Badge */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className={`font-black text-sm uppercase tracking-wider flex items-center gap-1.5 ${text}`}>
          <span>{icon}</span> {title}
        </h3>
        <span className="bg-white/95 border border-stone-200/50 shadow-sm text-stone-500 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
          {tasks.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[60vh] pr-0.5">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-stone-400/60 font-semibold text-xs border border-dashed border-stone-200 rounded-[20px] bg-white/20">
            Kéo thả hoặc thêm việc vào đây
          </div>
        ) : (
          tasks.map((task) => (
            <Card 
              key={task.id} 
              task={task} 
              onEdit={onEdit} 
              onMove={onMove} 
              onUpdateNotes={onUpdateNotes} 
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onMove: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
  onUpdateNotes: (taskId: string, notesJson: string) => Promise<void>;
}

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

const Card: React.FC<CardProps> = ({ task, onEdit, onMove, onUpdateNotes }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const priorityStyles = {
    low: "bg-blue-50 text-blue-600 border-blue-100",
    medium: "bg-orange-50 text-orange-600 border-orange-100",
    high: "bg-red-50 text-red-600 border-red-100",
  };

  const isInProgress = task.status === "in_progress";

  // Parse subtasks
  let subtasks: Subtask[] = [];
  if (task.notes) {
    try {
      const parsed = JSON.parse(task.notes);
      if (Array.isArray(parsed)) {
        subtasks = parsed;
      } else {
        subtasks = [{ id: "legacy", text: task.notes, completed: false }];
      }
    } catch {
      subtasks = [{ id: "legacy", text: task.notes, completed: false }];
    }
  }

  // Countdown timer calculations. Anchor on the last *status change*, not on
  // updated_at directly — updated_at also bumps when a subtask is ticked or
  // details are edited, which must not reset a running focus clock.
  const anchorRef = useRef(Date.parse(task.updatedAt));
  const prevStatusRef = useRef(task.status);
  if (prevStatusRef.current !== task.status) {
    prevStatusRef.current = task.status;
    anchorRef.current = Date.parse(task.updatedAt);
  }

  const getRemainingSeconds = useCallback(() => {
    const durationSeconds = task.focusDuration * 60;
    const elapsedSeconds = Math.floor((Date.now() - anchorRef.current) / 1000);
    return Math.max(0, durationSeconds - elapsedSeconds);
  }, [task.focusDuration]);

  const [timeLeft, setTimeLeft] = useState(getRemainingSeconds);

  useEffect(() => {
    setTimeLeft(getRemainingSeconds());
  }, [task.status, getRemainingSeconds]);

  useEffect(() => {
    if (task.status !== "in_progress" || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [task.status, getRemainingSeconds, timeLeft]);

  // Toggle subtask complete status
  const handleToggleSubtask = async (subId: string) => {
    const updated = subtasks.map((sub) =>
      sub.id === subId ? { ...sub, completed: !sub.completed } : sub
    );
    await onUpdateNotes(task.id, JSON.stringify(updated));
  };

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const progressPercent = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  // Render Time Left string
  const renderTimeLeft = () => {
    if (timeLeft <= 0) {
      return (
        <span className="flex items-center gap-1 text-red-650 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-black animate-bounce text-[9px]">
          ⏰ Hết giờ!
        </span>
      );
    }
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return (
      <span className="flex items-center gap-1 text-orange-650 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md font-black animate-pulse text-[9px]">
        ⏱️ {timeStr}
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      {...{ style }}
      className={`bg-white p-4 rounded-[22px] border shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative overflow-hidden ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${
        isInProgress ? "border-l-[3px] border-l-orange-400 border-t border-r border-b border-stone-200/60" : "border-stone-200/60"
      }`}
    >
      {/* Drag handle */}
      <div {...listeners} {...attributes} className="absolute inset-0 right-14" />

      <div className="relative pointer-events-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${priorityStyles[task.priority]}`}>
              {task.priority === "high" ? "Gấp" : task.priority === "medium" ? "Thường" : "Thấp"}
            </span>
            <span className="bg-stone-50 border border-stone-200 text-stone-500 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <User size={8} /> {task.assigneeType === "self" ? "Bản thân" : "Thỏ cưng"}
            </span>
            {isInProgress && (
              <span className="bg-orange-100 border border-orange-200 text-orange-600 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 animate-pulse">
                ⏳ Đang làm
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
            title="Chỉnh sửa công việc"
            aria-label="Chỉnh sửa công việc"
          >
            <Edit2 size={12} />
          </button>
        </div>

        <h4 className="text-xs font-black text-[#5c4033] mt-2 leading-snug break-words">
          {task.title}
        </h4>

        {/* Subtask interactive progress & check boxes */}
        {subtasks.length > 0 && (
          <div className="mt-2.5 space-y-1.5 border-t border-stone-100 pt-2 text-[10px]">
            <div className="flex items-center justify-between text-[9px] font-black text-stone-400 uppercase tracking-wide">
              <span>Nhiệm vụ con</span>
              <span>{completedSubtasks}/{subtasks.length}</span>
            </div>
            <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8b7355] rounded-full transition-all duration-300" 
                {...{ style: { width: `${progressPercent}%` } }}
              />
            </div>
            <div className="space-y-1 mt-1.5 max-h-[120px] overflow-y-auto pr-0.5">
              {subtasks.map((sub) => (
                <label 
                  key={sub.id} 
                  className="flex items-start gap-2 cursor-pointer hover:bg-stone-50/50 p-1 rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={sub.completed}
                    onChange={() => handleToggleSubtask(sub.id)}
                    className="w-3.5 h-3.5 mt-0.5 rounded border-[#ebdcc5] text-[#5c4033] focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                  <span className={`flex-1 text-[10px] font-bold text-[#5c4033] break-words leading-tight ${
                    sub.completed ? "line-through text-stone-400" : ""
                  }`}>
                    {sub.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-stone-100 text-[9px] font-bold text-stone-400">
          {isInProgress ? (
            renderTimeLeft()
          ) : (
            <span className="flex items-center gap-0.5">
              <Clock size={10} /> {task.focusDuration} phút
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-0.5">
              <Calendar size={10} /> {task.deadline.split("T")[0]}
            </span>
          )}
        </div>

        {/* Action buttons layout — side-by-side fitting narrow columns */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-stone-100">
          {task.status !== "todo" && (
            task.status === "done" ? (
              <button
                type="button"
                onClick={() => onMove(task.id, "in_progress")}
                className="flex-1 py-1.5 hover:bg-stone-100 rounded-xl transition-all text-stone-500 hover:text-stone-700 flex items-center justify-center gap-1.5 text-[10px] font-bold active:scale-95 border border-stone-200"
                title="Lùi về trạng thái Đang làm"
                aria-label="Lùi về trạng thái Đang làm"
              >
                <ArrowLeft size={12} />
                <span>Quay lại</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMove(task.id, "todo")}
                className="p-1.5 hover:bg-stone-100 rounded-xl transition-all text-stone-400 hover:text-stone-600 flex items-center justify-center active:scale-95 border border-stone-200 shrink-0"
                title="Lùi về trạng thái Cần làm"
                aria-label="Lùi về trạng thái Cần làm"
              >
                <ArrowLeft size={14} />
              </button>
            )
          )}
          {task.status !== "done" && (
            <button
              type="button"
              onClick={() => onMove(task.id, task.status === "todo" ? "in_progress" : "done")}
              className={`flex-grow py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wide active:scale-95 ${
                task.status === "todo"
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 animate-bounce"
              }`}
              title={task.status === "todo" ? "Bắt đầu làm" : "Đánh dấu hoàn thành"}
            >
              {task.status === "todo" ? <Play size={12} /> : <CheckCircle2 size={12} />}
              <span>{task.status === "todo" ? "Bắt đầu" : "Xong"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
