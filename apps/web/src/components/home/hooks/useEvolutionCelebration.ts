import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import confetti from "canvas-confetti";

const LAST_STAGE_KEY = "titroutine:lastPetStage";

// Detect an evolution since the last visit. The last-seen stage is persisted in
// localStorage so reaching a new form feels like a milestone (confetti + the pet
// jumping to "happy" via onEvolve) rather than a silent sprite swap. The
// first-ever load just records the baseline (no popup). Returns the "just
// evolved into" stage and its setter so the caller can drive the celebration
// modal and dismiss it.
export function useEvolutionCelebration(
  petStage: number,
  onEvolve: () => void
): [number | null, Dispatch<SetStateAction<number | null>>] {
  const [justEvolvedStage, setJustEvolvedStage] = useState<number | null>(null);

  useEffect(() => {
    const serverStage = petStage;
    const stored = window.localStorage.getItem(LAST_STAGE_KEY);
    if (stored !== null && serverStage > Number(stored)) {
      setJustEvolvedStage(serverStage);
      onEvolve();
      // Cinematic: pháo hoa mừng khoảnh khắc tiến hoá.
      confetti({ particleCount: 180, spread: 100, startVelocity: 45, origin: { y: 0.5 }, scalar: 1.1 });
      setTimeout(() => confetti({ particleCount: 110, angle: 60, spread: 70, origin: { x: 0, y: 0.6 } }), 250);
      setTimeout(() => confetti({ particleCount: 110, angle: 120, spread: 70, origin: { x: 1, y: 0.6 } }), 420);
    }
    window.localStorage.setItem(LAST_STAGE_KEY, String(serverStage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petStage]);

  return [justEvolvedStage, setJustEvolvedStage];
}
