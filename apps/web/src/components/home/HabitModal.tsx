"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2, X } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";
import {
  addHabitAction,
  archiveHabitAction,
  updateHabitAction,
} from "@/app/[locale]/actions";
import type { HabitWithLog, FrequencyType, TimeOfDay, HabitType } from "@/lib/types";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** When provided, the modal edits an existing habit instead of creating one. */
  habit?: HabitWithLog | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSaved, habit }) => {
  const t = useTranslations("HabitModal");
  const isEdit = Boolean(habit);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<HabitType>("boolean");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("anytime");
  const [duration, setDuration] = useState(15);
  const [targetCount, setTargetCount] = useState(5);
  const [freqType, setFreqType] = useState<FrequencyType>("daily");
  const [freqDays, setFreqDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Hydrate the form whenever the target habit changes.
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setType(habit.type);
      setTimeOfDay(habit.timeOfDay || "anytime");
      setDuration(habit.config.target_time ? Math.round(habit.config.target_time / 60) : 15);
      setTargetCount(habit.config.target_count || 5);
      setFreqType(habit.frequency?.type || "daily");
      setFreqDays(habit.frequency?.days || []);
    } else {
      setTitle("");
      setType("boolean");
      setTimeOfDay("anytime");
      setDuration(15);
      setTargetCount(5);
      setFreqType("daily");
      setFreqDays([]);
    }
    setError(null);
    setConfirmDelete(false);
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      const frequency = {
        type: freqType,
        days: freqType === "specific_days" ? freqDays : undefined,
      };

        const result = isEdit
          ? await updateHabitAction({
              id: habit!.id,
              title,
              type,
              durationMinutes: type === "timer" ? duration : undefined,
              targetCount: type === "counter" ? targetCount : undefined,
              frequency,
              timeOfDay,
            })
          : await addHabitAction({
              title,
              type: type as HabitType,
              durationMinutes: type === "timer" ? duration : undefined,
              targetCount: type === "counter" ? targetCount : undefined,
              frequency,
              timeOfDay,
            });

      if (result?.error) {
        setError(t("error"));
        return;
      }
      onSaved();
      onClose();
    });
  };

  const handleDelete = () => {
    if (!habit) return;
    // Require a second tap so a stray click can't archive a habit by accident.
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await archiveHabitAction(habit.id);
      if (result?.error) {
        setError(t("error"));
        return;
      }
      onSaved();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-earth-bg rounded-2xl shadow-2xl overflow-hidden border-2 border-earth-brown/10">
        {/* Notebook spiral binding visual */}
        <div className="absolute top-0 left-0 w-full h-8 bg-amber-100 flex items-center justify-evenly border-b-2 border-earth-brown/10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-2 h-6 bg-earth-brown/30 rounded-full shadow-inner translate-y-1" />
          ))}
        </div>

        <div className="pt-10 pb-4 px-6 flex items-center justify-between border-b-2 border-gray-100 border-dashed">
          <h2 className="text-xl font-bold text-earth-brown font-serif italic">
            {isEdit ? t("editTitle") : t("newTitle")}
          </h2>
          <button
            aria-label={t("close")}
            title={t("close")}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-earth-text">{t("name")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-earth-text">{t("type")}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("boolean")}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                  type === "boolean"
                    ? "border-fire-orange bg-orange-50 text-fire-orange"
                    : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                💧 {t("typeDaily")}
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
                ⏳ {t("typeTimer")}
              </button>
              <button
                type="button"
                onClick={() => setType("counter")}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                  type === "counter"
                    ? "border-fire-orange bg-orange-50 text-fire-orange"
                    : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                🔢 {t("typeCounter")}
              </button>
              <button
                type="button"
                onClick={() => setType("negative")}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${
                  type === "negative"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                💥 {t("typeNegative")}
              </button>
            </div>
          </div>

          {type === "timer" && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-earth-text">{t("duration")}</label>
              <input
                aria-label={t("duration")}
                title={t("duration")}
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none transition-colors"
              />
            </div>
          )}

          {type === "counter" && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-earth-text">{t("counterLabel")}</label>
              <input
                aria-label={t("counterAria")}
                title={t("counterAria")}
                type="number"
                min={1}
                max={999}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-fire-orange focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-earth-text">{t("timeOfDay")}</label>
            <div className="flex gap-2">
              {[
                { id: "morning", label: `🌅 ${t("todMorning")}` },
                { id: "afternoon", label: `☀️ ${t("todAfternoon")}` },
                { id: "evening", label: `🌙 ${t("todEvening")}` },
                { id: "anytime", label: `♾️ ${t("todAnytime")}` },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setTimeOfDay(b.id as TimeOfDay)}
                  className={`flex-1 p-2 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all ${
                    timeOfDay === b.id
                      ? "border-fire-orange bg-orange-50 text-fire-orange"
                      : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-earth-text">{t("schedule")}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFreqType("daily")}
                className={`flex-1 p-2 rounded-xl border-2 font-bold transition-all ${
                  freqType === "daily"
                    ? "border-fire-orange bg-orange-50 text-fire-orange"
                    : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                {t("freqDaily")}
              </button>
              <button
                type="button"
                onClick={() => setFreqType("specific_days")}
                className={`flex-1 p-2 rounded-xl border-2 font-bold transition-all ${
                  freqType === "specific_days"
                    ? "border-fire-orange bg-orange-50 text-fire-orange"
                    : "border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
                }`}
              >
                {t("freqSpecific")}
              </button>
            </div>
            {freqType === "specific_days" && (
              <div className="flex justify-between mt-2 gap-1 animate-in slide-in-from-top-2">
                {[1, 2, 3, 4, 5, 6, 0].map((d, index) => {
                  const labels = t("weekdaysShort").split(",");
                  const isSelected = freqDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        if (isSelected) setFreqDays(freqDays.filter(day => day !== d));
                        else setFreqDays([...freqDays, d]);
                      }}
                      className={`w-10 h-10 rounded-full font-bold transition-all ${
                        isSelected 
                          ? "bg-fire-orange text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {labels[index]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="pt-2 space-y-3">
            <DuoButton type="submit" variant="primary" fullWidth size="lg" disabled={isPending}>
              {isEdit ? t("save") : t("create")}
            </DuoButton>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 ${
                  confirmDelete
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "text-red-500 hover:text-red-600"
                }`}
              >
                <Trash2 size={16} /> {confirmDelete ? t("deleteConfirm") : t("delete")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
