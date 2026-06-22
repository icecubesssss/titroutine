import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Habit {
  id: string;
  title: string;
  isCompleted: boolean;
  type: "daily" | "timer";
  duration?: number; // for timer type
}

interface HabitState {
  coins: number;
  currentStreak: number;
  habits: Habit[];
  completeHabit: (id: string) => void;
  addHabit: (habit: Omit<Habit, "id" | "isCompleted">) => void;
  resetDaily: () => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set) => ({
      coins: 150,
      currentStreak: 12,
      habits: [
        { id: "1", title: "Uống nước (2L)", type: "daily", isCompleted: true },
        { id: "2", title: "Học Tiếng Anh", type: "timer", duration: 30, isCompleted: false },
        { id: "3", title: "Thiền định", type: "timer", duration: 15, isCompleted: false },
      ],
      completeHabit: (id) =>
        set((state) => {
          const newHabits = state.habits.map((h) =>
            h.id === id ? { ...h, isCompleted: true } : h
          );
          // Only add coins if it was not already completed
          const habit = state.habits.find((h) => h.id === id);
          const earnedCoins = habit && !habit.isCompleted ? 10 : 0;
          return {
            habits: newHabits,
            coins: state.coins + earnedCoins,
          };
        }),
      addHabit: (habit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            { ...habit, id: Math.random().toString(36).substr(2, 9), isCompleted: false },
          ],
        })),
      resetDaily: () =>
        set((state) => ({
          habits: state.habits.map((h) => ({ ...h, isCompleted: false })),
        })),
    }),
    {
      name: "titroutine-storage",
    }
  )
);
