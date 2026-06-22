"use client";

import React, { useState } from "react";
import { DuoButton } from "@/components/ui/DuoButton";
import { X } from "lucide-react";
import { useHabitStore } from "@/store/useHabitStore";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"daily" | "timer">("daily");
  const [duration, setDuration] = useState(15);
  const addHabit = useHabitStore((state) => state.addHabit);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addHabit({
      title,
      type,
      duration: type === "timer" ? duration : undefined,
    });
    
    // Reset form and close
    setTitle("");
    setType("daily");
    setDuration(15);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Notebook-styled Modal */}
      <div className="relative w-full max-w-sm bg-earth-bg rounded-2xl shadow-2xl overflow-hidden border-2 border-earth-brown/10">
        
        {/* Notebook Spiral Binding visual effect */}
        <div className="absolute top-0 left-0 w-full h-8 bg-amber-100 flex items-center justify-evenly border-b-2 border-earth-brown/10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-2 h-6 bg-earth-brown/30 rounded-full shadow-inner translate-y-1" />
          ))}
        </div>

        {/* Header */}
        <div className="pt-10 pb-4 px-6 flex items-center justify-between border-b-2 border-gray-100 border-dashed">
          <h2 className="text-xl font-bold text-earth-brown font-serif italic">New Habit</h2>
          <button 
            aria-label="Close"
            title="Close"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-earth-text">Habit Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 10 pages"
              className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-earth-text">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("daily")}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                  type === "daily" 
                  ? "border-fire-orange bg-orange-50 text-fire-orange" 
                  : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                💧 Daily
              </button>
              <button
                type="button"
                onClick={() => setType("timer")}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                  type === "timer" 
                  ? "border-fire-orange bg-orange-50 text-fire-orange" 
                  : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                ⏳ Timer
              </button>
            </div>
          </div>

          {type === "timer" && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-earth-text">Duration (minutes)</label>
              <input
                id="habit-duration"
                name="duration"
                aria-label="Duration in minutes"
                title="Duration in minutes"
                placeholder="Duration"
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="pt-4">
            <DuoButton type="submit" variant="primary" fullWidth size="lg">
              Save Habit
            </DuoButton>
          </div>
        </form>
      </div>
    </div>
  );
};
