"use client";

import { useState, useCallback } from "react";

export type PandaActionState = "idle" | "working" | "happy" | "sad" | "eating";

export function usePandaAction(initialAction: PandaActionState = "idle") {
  const [currentAction, setCurrentAction] = useState<PandaActionState>(initialAction);

  const startWorking = useCallback(() => {
    setCurrentAction("working");
  }, []);

  const stopWorking = useCallback(() => {
    setCurrentAction("idle");
  }, []);

  const triggerReaction = useCallback((action: PandaActionState, durationMs = 3000) => {
    setCurrentAction(action);
    if (durationMs > 0) {
      setTimeout(() => {
        setCurrentAction("idle");
      }, durationMs);
    }
  }, []);

  return {
    currentAction,
    setCurrentAction,
    startWorking,
    stopWorking,
    triggerReaction,
  };
}
