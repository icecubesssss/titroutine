"use client";

import React, { useState } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, useDroppable, useDraggable } from "@dnd-kit/core";
import { Plus, Play, CheckCircle2, User, Clock, Calendar, ArrowRight, ArrowLeft, Edit2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { updateTaskStatusAction } from "@/app/[locale]/actions";
import { useSound } from "@/hooks/useSound";
import { TaskDrawer } from "./TaskDrawer";

interface TaskBoardProps {
  tasks: Task[];
  onRefresh: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onRefresh }) => {
  const { playPop } = useSound();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    playPop();
    await updateTaskStatusAction(taskId, newStatus);
    onRefresh();
  };

  const moveTask = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    playPop();
    await updateTaskStatusAction(taskId, newStatus);
    onRefresh();
  };

  const columns: { id: "todo" | "in_progress" | "done"; title: string; bg: string; border: string; text: string; icon: string }[] = [
    { id: "todo", title: "Cần làm", bg: "bg-stone-50/70", border: "border-stone-200/50", text: "text-stone-700", icon: "📝" },
    { id: "in_progress", title: "Đang làm", bg: "bg-orange-50/70", border: "border-orange-200/50", text: "text-orange-700", icon: "🌱" },
    { id: "done", title: "Đã hoàn thành", bg: "bg-emerald-50/70", border: "border-emerald-200/50", text: "text-emerald-700", icon: "✨" },
  ];

  return (
    <div className="space-y-6 select-none h-full flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-theme-text flex items-center gap-2">
          📋 Bảng Công Việc
        </h2>
        <button
          onClick={() => {
            setEditingTask(null);
            setIsDrawerOpen(true);
          }}
          className="bg-theme-accent hover:brightness-105 text-white font-bold text-xs px-3.5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus size={14} strokeWidth={2.5} /> Thêm việc
        </button>
      </div>

      {/* Kanban Grid */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
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
                  setIsDrawerOpen(true);
                }}
                onMove={moveTask}
              />
            );
          })}
        </div>
      </DndContext>

      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={onRefresh}
        task={editingTask}
      />
    </div>
  );
};

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
}

const Column: React.FC<ColumnProps> = ({ id, title, bg, border, text, icon, tasks, onEdit, onMove }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-[28px] border-2 p-4 min-h-[400px] flex flex-col transition-colors ${bg} ${border} ${
        isOver ? "bg-theme-accent-light/10 border-theme-accent/30" : ""
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
            <Card key={task.id} task={task} onEdit={onEdit} onMove={onMove} />
          ))
        )}
      </div>
    </div>
  );
};

interface CardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onMove: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
}

const Card: React.FC<CardProps> = ({ task, onEdit, onMove }) => {
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

  return (
    <div
      ref={setNodeRef}
      {...{ style }}
      className={`bg-white p-4 rounded-[22px] border border-stone-250 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none relative ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div {...listeners} {...attributes} className="absolute inset-0 right-14" />

      <div className="relative pointer-events-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${priorityStyles[task.priority]}`}>
              {task.priority === "high" ? "Gấp" : task.priority === "medium" ? "Thường" : "Thấp"}
            </span>
            <span className="bg-stone-50 border border-stone-200 text-stone-500 text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <User size={8} /> {task.assigneeType === "self" ? "Bản thân" : "Thỏ cưng"}
            </span>
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

        <h4 className="text-xs font-black text-[#5c4033] mt-2 leading-snug line-clamp-2">
          {task.title}
        </h4>

        {task.notes && (
          <p className="text-[10px] font-semibold text-stone-400 mt-1 line-clamp-2 leading-relaxed">
            {task.notes}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-stone-100 text-[9px] font-bold text-stone-400">
          <span className="flex items-center gap-0.5">
            <Clock size={10} /> {task.focusDuration} phút
          </span>
          {task.deadline && (
            <span className="flex items-center gap-0.5">
              <Calendar size={10} /> {task.deadline.split("T")[0]}
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-1.5 border-t border-dashed border-stone-100">
          {task.status !== "todo" && (
            <button
              type="button"
              onClick={() => onMove(task.id, task.status === "done" ? "in_progress" : "todo")}
              className="p-1 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-theme-accent"
              title="Di chuyển sang trái"
            >
              <ArrowLeft size={12} />
            </button>
          )}
          {task.status !== "done" && (
            <button
              type="button"
              onClick={() => onMove(task.id, task.status === "todo" ? "in_progress" : "done")}
              className="p-1 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-theme-accent flex items-center gap-0.5 text-[8px] font-black uppercase"
              title="Di chuyển sang phải"
            >
              {task.status === "todo" ? <Play size={10} /> : <CheckCircle2 size={10} />}
              <span className="leading-none">{task.status === "todo" ? "Bắt đầu" : "Xong"}</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
