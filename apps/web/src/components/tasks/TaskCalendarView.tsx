"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  Plus,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import type { Task } from "@/lib/types";

interface TaskCalendarViewProps {
  mode: "week" | "month";
  tasks: Task[];
  weekDates: string[];
  currentDate?: string;
  onCreateForDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onUpdateDeadline: (taskId: string, deadline: string | null) => Promise<void> | void;
  onPlayPop: () => void;
}

const WEEK_DAYS_LONG = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const WEEK_DAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const PRIORITY_RANK: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortDayTasks(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    if (a.status === "in_progress" && b.status !== "in_progress") return -1;
    if (a.status !== "in_progress" && b.status === "in_progress") return 1;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}

function toDeadlineISO(dateStr: string): string {
  // Anchor at noon UTC so `.slice(0, 10)` and `.split("T")[0]` stay date-stable across timezones.
  return `${dateStr}T12:00:00.000Z`;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  mode,
  tasks,
  weekDates,
  currentDate,
  onCreateForDate,
  onEditTask,
  onToggleDone,
  onUpdateDeadline,
  onPlayPop,
}) => {
  const realToday = format(new Date(), "yyyy-MM-dd");
  const initialRefDate = currentDate || realToday;

  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(parseISO(initialRefDate))
  );
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(initialRefDate);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const lastDragEndRef = useRef(0);

  const handleSafeEdit = (task: Task) => {
    if (Date.now() - lastDragEndRef.current < 160) return;
    onEditTask(task);
  };

  useEffect(() => {
    if (currentDate) {
      setViewMonth(startOfMonth(parseISO(currentDate)));
      setSelectedMobileDate(currentDate);
    }
  }, [currentDate]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 5 } })
  );

  // Index scheduled tasks by YYYY-MM-DD deadline
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!task.deadline) continue;
      const dateKey = task.deadline.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(task);
    }
    for (const dateKey of Object.keys(map)) {
      map[dateKey] = sortDayTasks(map[dateKey]);
    }
    return map;
  }, [tasks]);

  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !t.deadline && t.status !== "done"),
    [tasks]
  );

  // Full Monday-to-Sunday grid covering the viewed month
  const monthGridDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => ({
      date: day,
      dateStr: format(day, "yyyy-MM-dd"),
      inCurrentMonth: isSameMonth(day, viewMonth),
    }));
  }, [viewMonth]);

  const monthStats = useMemo(() => {
    const monthPrefix = format(viewMonth, "yyyy-MM");
    const inMonth = tasks.filter(
      (t) => t.deadline && t.deadline.slice(0, 7) === monthPrefix
    );
    const done = inMonth.filter((t) => t.status === "done").length;
    return { total: inMonth.length, done };
  }, [tasks, viewMonth]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    lastDragEndRef.current = Date.now();
    setActiveTask(null);
    if (!over) return;

    const rawTaskId = String(active.id).replace(/^(mobile-)?task:/, "");
    const draggedTask =
      (active.data.current?.task as Task | undefined) ??
      tasks.find((t) => t.id === rawTaskId);
    if (!draggedTask) return;

    const overId = String(over.id);

    if (overId === "unscheduled") {
      if (!draggedTask.deadline || draggedTask.status === "done") return;
      onPlayPop();
      await onUpdateDeadline(draggedTask.id, null);
      return;
    }

    if (overId.startsWith("day:")) {
      const targetDate = overId.slice(4);
      if (draggedTask.deadline && draggedTask.deadline.slice(0, 10) === targetDate) {
        return;
      }
      onPlayPop();
      await onUpdateDeadline(draggedTask.id, toDeadlineISO(targetDate));
    }
  };

  const selectedDayTasks = tasksByDate[selectedMobileDate] || [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        lastDragEndRef.current = Date.now();
        setActiveTask(null);
      }}
    >
      <div className={`space-y-6 animate-in fade-in duration-200 ${activeTask ? "cursor-grabbing" : ""}`}>
        {mode === "week" ? (
          /* ── Week Columns Grid ──────────────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weekDates.map((dateStr, idx) => {
              const isToday = dateStr === (currentDate || realToday);
              const dayTasks = tasksByDate[dateStr] || [];
              return (
                <DroppableWeekDay
                  key={dateStr}
                  dateStr={dateStr}
                  dayLabel={WEEK_DAYS_LONG[idx]}
                  isToday={isToday}
                  tasks={dayTasks}
                  onCreateForDate={onCreateForDate}
                  onEditTask={handleSafeEdit}
                  onToggleDone={onToggleDone}
                />
              );
            })}
          </div>
        ) : (
          /* ── Month Calendar Grid ────────────────────────────────────── */
          <div className="space-y-4">
            {/* Month Navigation Header */}
            <div className="bg-white/95 border-2 border-[#ebdcc5] rounded-2xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Tháng trước"
                  onClick={() => setViewMonth((m) => subMonths(m, 1))}
                  className="p-1.5 rounded-full hover:bg-theme-accent-light text-stone-600 hover:text-theme-accent transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-sm sm:text-base font-black text-stone-800 min-w-[140px] text-center">
                  {format(viewMonth, "'Tháng' MM / yyyy")}
                </h3>
                <button
                  type="button"
                  aria-label="Tháng sau"
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-full hover:bg-theme-accent-light text-stone-600 hover:text-theme-accent transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {monthStats.total > 0 && (
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                    {monthStats.done}/{monthStats.total} việc xong
                  </span>
                )}
                {!isSameMonth(viewMonth, parseISO(realToday)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMonth(startOfMonth(parseISO(realToday)));
                      setSelectedMobileDate(realToday);
                    }}
                    className="bg-theme-accent-light hover:bg-theme-accent hover:text-white text-theme-accent text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                  >
                    Tháng này
                  </button>
                )}
              </div>
            </div>

            {/* 7-column Month Grid */}
            <div className="bg-white/95 border-2 border-[#ebdcc5] rounded-3xl p-2.5 sm:p-3.5 shadow-2xs">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2 text-center">
                {WEEK_DAYS_SHORT.map((label, idx) => (
                  <div
                    key={label}
                    className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-1 ${
                      idx >= 5 ? "text-orange-500" : "text-stone-400"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {monthGridDays.map(({ date, dateStr, inCurrentMonth }) => (
                  <DroppableMonthDay
                    key={dateStr}
                    date={date}
                    dateStr={dateStr}
                    inCurrentMonth={inCurrentMonth}
                    isToday={dateStr === realToday}
                    isSelectedMobile={dateStr === selectedMobileDate}
                    tasks={tasksByDate[dateStr] || []}
                    onSelectMobile={() => setSelectedMobileDate(dateStr)}
                    onCreateForDate={onCreateForDate}
                    onEditTask={handleSafeEdit}
                    onToggleDone={onToggleDone}
                  />
                ))}
              </div>
            </div>

            {/* Mobile Selected Day Task Drawer (for narrow screens where cells show dots) */}
            <div className="sm:hidden bg-white border-2 border-[#ebdcc5] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CalendarIcon size={14} className="text-theme-accent shrink-0" />
                  <span className="text-xs font-black text-stone-800 truncate">
                    {format(parseISO(selectedMobileDate), "dd/MM/yyyy")}
                    {selectedMobileDate === realToday ? " (Hôm nay)" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateForDate(selectedMobileDate)}
                  className="bg-theme-accent-light text-theme-accent hover:bg-theme-accent hover:text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors shrink-0"
                >
                  <Plus size={12} /> Thêm việc
                </button>
              </div>
              {selectedDayTasks.length === 0 ? (
                <p className="text-[11px] text-stone-400 italic">
                  Chưa có việc vào ngày này. Kéo việc từ bên dưới thả vào ô ngày trên lịch nhé!
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayTasks.map((task) => (
                    <DraggableTaskChip
                      key={task.id}
                      task={task}
                      compact={false}
                      idPrefix="mobile-"
                      onEditTask={handleSafeEdit}
                      onToggleDone={onToggleDone}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Unscheduled Backlog Section (Draggable & Droppable) ──────── */}
        <DroppableUnscheduledArea
          tasks={unscheduledTasks}
          canDropBack={Boolean(activeTask && activeTask.status !== "done" && activeTask.deadline)}
          onToggleDone={onToggleDone}
          onAssignToday={(taskId) => {
            onPlayPop();
            onUpdateDeadline(taskId, toDeadlineISO(realToday));
          }}
          onEditTask={handleSafeEdit}
        />
      </div>

      {/* Floating drag preview rendered outside overflow containers */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="bg-white border-2 border-theme-accent rounded-xl px-3 py-2 shadow-xl text-xs font-bold text-stone-800 max-w-[220px] flex items-center gap-2 cursor-grabbing opacity-95 pointer-events-none">
            <GripVertical size={13} className="text-theme-accent shrink-0" />
            <span className="truncate">{activeTask.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// ── Week Day Droppable Column ────────────────────────────────────────────────
const DroppableWeekDay: React.FC<{
  dateStr: string;
  dayLabel: string;
  isToday: boolean;
  tasks: Task[];
  onCreateForDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}> = ({ dateStr, dayLabel, isToday, tasks, onCreateForDate, onEditTask, onToggleDone }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dateStr}`,
    data: { type: "day", dateStr },
  });
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-3 min-h-[220px] flex flex-col transition-all ${
        isOver
          ? "bg-theme-accent-light/35 border-theme-accent ring-2 ring-theme-accent/30 scale-[1.01]"
          : isToday
          ? "bg-amber-50/70 border-amber-300 shadow-xs"
          : "bg-white/95 border-[#ebdcc5]"
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-theme-accent">{dayLabel}</span>
          <span className="text-[11px] font-bold text-stone-500">
            {format(parseISO(dateStr), "dd/MM")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {tasks.length > 0 && (
            <span className="text-[10px] font-black text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full">
              {doneCount}/{tasks.length}
            </span>
          )}
          <button
            type="button"
            title={`Thêm việc vào ${dayLabel}`}
            aria-label={`Thêm việc vào ${dayLabel}`}
            onClick={() => onCreateForDate(dateStr)}
            className="w-5 h-5 rounded-full bg-theme-accent-light text-theme-accent hover:bg-theme-accent hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 space-y-2 overflow-y-auto overscroll-contain max-h-[360px] pr-0.5">
        {tasks.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center py-6 rounded-xl transition-colors ${
              isOver
                ? "border border-dashed border-theme-accent text-theme-accent bg-white/60"
                : "text-stone-300"
            }`}
          >
            <span className="text-[11px] font-semibold">
              {isOver ? "Thả vào ngày này" : "Chưa có việc"}
            </span>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableWeekTaskCard
              key={task.id}
              task={task}
              onEditTask={onEditTask}
              onToggleDone={onToggleDone}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Draggable Week Task Card ─────────────────────────────────────────────────
const DraggableWeekTaskCard: React.FC<{
  task: Task;
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}> = ({ task, onEditTask, onToggleDone }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={`group p-2 rounded-xl border transition-all text-xs flex flex-col gap-1.5 shadow-2xs cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-35 scale-95 border-dashed border-theme-accent" : ""
      } ${
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
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onToggleDone(task)}
          aria-label={task.status === "done" ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
          className={`w-4 h-4 rounded-md mt-0.5 shrink-0 flex items-center justify-center border transition-all ${
            task.status === "done"
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "bg-white border-stone-300 hover:border-theme-accent"
          }`}
        >
          {task.status === "done" && <Check size={11} strokeWidth={3} />}
        </button>
        <button
          type="button"
          onClick={() => onEditTask(task)}
          className={`flex-1 min-w-0 text-left font-bold cursor-pointer text-stone-800 leading-snug line-clamp-2 ${
            task.status === "done" ? "line-through text-stone-400" : ""
          }`}
        >
          {task.title}
        </button>
        <span
          {...attributes}
          aria-label={`Kéo thả công việc: ${task.title}`}
          className="touch-none text-stone-300 group-hover:text-stone-500 shrink-0 mt-0.5"
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
        >
          <GripVertical size={12} />
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
          {task.priority === "high" ? "Cao" : task.priority === "medium" ? "Vừa" : "Thấp"}
        </span>
      </div>
    </div>
  );
};

// ── Month Day Droppable Cell ─────────────────────────────────────────────────
const DroppableMonthDay: React.FC<{
  date: Date;
  dateStr: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelectedMobile: boolean;
  tasks: Task[];
  onSelectMobile: () => void;
  onCreateForDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}> = ({
  date,
  dateStr,
  inCurrentMonth,
  isToday,
  isSelectedMobile,
  tasks,
  onSelectMobile,
  onCreateForDate,
  onEditTask,
  onToggleDone,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dateStr}`,
    data: { type: "day", dateStr },
  });

  const pendingCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <div
      ref={setNodeRef}
      onClick={onSelectMobile}
      className={`group/cell min-w-0 min-h-[60px] sm:min-h-[118px] rounded-2xl border-2 p-1.5 flex flex-col transition-all relative ${
        isOver
          ? "border-theme-accent bg-theme-accent-light/40 ring-2 ring-theme-accent/30 scale-[1.02] z-10"
          : isToday
          ? "border-amber-300 bg-amber-50/70"
          : inCurrentMonth
          ? "border-stone-100 bg-white hover:border-[#ebdcc5]"
          : "border-stone-100/60 bg-stone-50/60 opacity-55 hover:opacity-90"
      } ${isSelectedMobile && !isOver ? "max-sm:ring-2 max-sm:ring-theme-accent max-sm:border-theme-accent" : ""}`}
    >
      {/* Day Number + Add Button */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={`text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isToday
              ? "bg-amber-500 text-white"
              : inCurrentMonth
              ? "text-stone-700"
              : "text-stone-400"
          }`}
        >
          {format(date, "d")}
        </span>

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onCreateForDate(dateStr);
          }}
          title={`Thêm việc vào ${format(date, "dd/MM")}`}
          aria-label={`Thêm việc vào ${format(date, "dd/MM")}`}
          className="hidden sm:flex w-4 h-4 rounded-full bg-theme-accent-light text-theme-accent hover:bg-theme-accent hover:text-white items-center justify-center opacity-0 group-hover/cell:opacity-100 focus:opacity-100 transition-opacity shrink-0"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Mobile compact indicator dots */}
      <div className="sm:hidden flex flex-wrap items-center gap-0.5 mt-auto">
        {tasks.slice(0, 3).map((t) => (
          <span
            key={t.id}
            className={`w-1.5 h-1.5 rounded-full ${
              t.status === "done"
                ? "bg-emerald-400"
                : t.priority === "high"
                ? "bg-red-500"
                : t.status === "in_progress"
                ? "bg-orange-400"
                : "bg-theme-accent"
            }`}
          />
        ))}
        {tasks.length > 3 && (
          <span className="text-[8px] font-black text-stone-400">+{tasks.length - 3}</span>
        )}
        {pendingCount === 0 && tasks.length > 0 && (
          <span className="text-[9px] font-black text-emerald-600 ml-auto">✓</span>
        )}
      </div>

      {/* Desktop / Tablet draggable task chips */}
      <div className="hidden sm:flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto overscroll-contain max-h-[116px] pr-0.5">
        {tasks.map((task) => (
          <DraggableTaskChip
            key={task.id}
            task={task}
            compact
            onEditTask={onEditTask}
            onToggleDone={onToggleDone}
          />
        ))}
        {isOver && tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-theme-accent/60 bg-white/60 text-[10px] font-bold text-theme-accent">
            Thả vào đây
          </div>
        )}
      </div>
    </div>
  );
};

// ── Draggable Task Chip (Month Cell & Mobile Selected Day List) ──────────────
const DraggableTaskChip: React.FC<{
  task: Task;
  compact: boolean;
  idPrefix?: string;
  onEditTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}> = ({ task, compact, idPrefix = "", onEditTask, onToggleDone }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${idPrefix}task:${task.id}`,
    data: { task },
  });

  const priorityAccent =
    task.status === "done"
      ? "bg-emerald-50/70 border-emerald-200 text-stone-400"
      : task.status === "in_progress"
      ? "bg-orange-50 border-orange-300 text-orange-900"
      : task.priority === "high"
      ? "bg-red-50/80 border-red-200 text-stone-800"
      : task.priority === "medium"
      ? "bg-amber-50/60 border-amber-200 text-stone-800"
      : "bg-stone-50 border-stone-200 text-stone-700";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      title={task.title}
      className={`group/chip rounded-lg border flex items-center gap-1 transition-all cursor-grab active:cursor-grabbing min-w-0 ${
        compact ? "px-1.5 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs"
      } ${priorityAccent} ${
        isDragging ? "opacity-30 border-dashed border-theme-accent scale-95" : "hover:border-theme-accent/60"
      }`}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone(task);
        }}
        aria-label={task.status === "done" ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
        className={`rounded flex items-center justify-center border shrink-0 transition-colors ${
          compact ? "w-3 h-3" : "w-4 h-4"
        } ${
          task.status === "done"
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "bg-white border-stone-300 hover:border-theme-accent"
        }`}
      >
        {task.status === "done" && <Check size={compact ? 8 : 10} strokeWidth={3} />}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditTask(task);
        }}
        className={`flex-1 min-w-0 text-left truncate font-bold cursor-pointer ${
          task.status === "done" ? "line-through text-stone-400" : ""
        }`}
      >
        {task.title}
      </button>

      <span
        {...attributes}
        aria-label={`Kéo thả công việc: ${task.title}`}
        className="touch-none text-stone-300 group-hover/chip:text-stone-500 shrink-0"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        <GripVertical size={compact ? 10 : 12} />
      </span>
    </div>
  );
};

// ── Unscheduled Backlog (Droppable & Draggable Items) ────────────────────────
const DroppableUnscheduledArea: React.FC<{
  tasks: Task[];
  canDropBack: boolean;
  onToggleDone: (task: Task) => void;
  onAssignToday: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}> = ({ tasks, canDropBack, onToggleDone, onAssignToday, onEditTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: "unscheduled",
    data: { type: "unscheduled" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded-2xl transition-all ${
        tasks.length === 0 ? "px-4 py-3" : "p-4"
      } ${
        isOver && canDropBack
          ? "bg-theme-accent-light/30 border-theme-accent ring-2 ring-theme-accent/25"
          : "bg-stone-50 border-stone-200/80"
      }`}
    >
      <div className={`flex items-center justify-between flex-wrap gap-1 ${tasks.length > 0 ? "mb-3" : ""}`}>
        <h4 className="text-xs font-black text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
          📋 Việc chưa xếp lịch ({tasks.length})
        </h4>
        <span className="text-[11px] text-stone-400">
          {isOver && canDropBack
            ? "Thả vào đây để bỏ hạn chót"
            : tasks.length === 0
            ? "Kéo công việc từ lịch thả vào đây để bỏ hạn chót"
            : "Kéo thả vào ngày trên lịch hoặc gán nhanh"}
        </span>
      </div>

      {tasks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {tasks.map((t) => (
            <DraggableUnscheduledItem
              key={t.id}
              task={t}
              onToggleDone={onToggleDone}
              onAssignToday={onAssignToday}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DraggableUnscheduledItem: React.FC<{
  task: Task;
  onToggleDone: (task: Task) => void;
  onAssignToday: (taskId: string) => void;
  onEditTask: (task: Task) => void;
}> = ({ task, onToggleDone, onAssignToday, onEditTask }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task:${task.id}`,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      className={`group bg-white border border-stone-200 hover:border-theme-accent/60 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs text-xs cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-35 scale-95 border-dashed border-theme-accent" : ""
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span
          {...attributes}
          aria-label={`Kéo thả công việc: ${task.title}`}
          className="touch-none text-stone-300 group-hover:text-stone-500 shrink-0"
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
        >
          <GripVertical size={13} />
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onToggleDone(task)}
          aria-label="Đánh dấu hoàn thành"
          className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center border border-stone-300 hover:border-theme-accent"
        />
        <button
          type="button"
          onClick={() => onEditTask(task)}
          className="flex-1 min-w-0 text-left font-bold text-stone-700 truncate cursor-pointer"
        >
          {task.title}
        </button>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onAssignToday(task.id)}
          className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
        >
          Hôm nay
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEditTask(task)}
          className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
        >
          Sửa
        </button>
      </div>
    </div>
  );
};
