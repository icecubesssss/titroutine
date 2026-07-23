"use client";

import { useState } from "react";

export interface PandaMoodState {
  happyMeter: number; // 0..100
  satiety: number;    // 0..100
  affection: number;  // 0..100
  happyModeEnabled: boolean;
}

export function usePandaMood(initialSatiety = 80, initialAffection = 50) {
  const [mood, setMood] = useState<PandaMoodState>({
    happyMeter: 85,
    satiety: initialSatiety,
    affection: initialAffection,
    happyModeEnabled: true,
  });

  const isHappy = mood.happyMeter >= 60;
  const isSad = mood.happyMeter < 30;

  const toggleHappyMode = () => {
    setMood((prev) => ({
      ...prev,
      happyModeEnabled: !prev.happyModeEnabled,
    }));
  };

  const feedPanda = (amount = 20) => {
    setMood((prev) => ({
      ...prev,
      satiety: Math.min(100, prev.satiety + amount),
      happyMeter: Math.min(100, prev.happyMeter + 10),
    }));
  };

  const petPanda = (amount = 15) => {
    setMood((prev) => ({
      ...prev,
      affection: Math.min(100, prev.affection + amount),
      happyMeter: Math.min(100, prev.happyMeter + 5),
    }));
  };

  const completeStudyBonus = () => {
    setMood((prev) => ({
      ...prev,
      happyMeter: Math.min(100, prev.happyMeter + 25),
      affection: Math.min(100, prev.affection + 10),
    }));
  };

  return {
    mood,
    isHappy,
    isSad,
    toggleHappyMode,
    feedPanda,
    petPanda,
    completeStudyBonus,
  };
}
