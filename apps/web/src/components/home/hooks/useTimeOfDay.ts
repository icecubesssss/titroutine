import { useEffect, useState } from "react";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

// Time-of-day tint for room lighting. Defaults to "day" and is only set from the
// client (in the effect) so the first render matches the server — no hydration
// mismatch. Refreshes hourly.
export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");

  useEffect(() => {
    const compute = () => {
      const h = new Date().getHours();
      setTimeOfDay(h < 6 || h >= 22 ? "night" : h < 9 ? "morning" : h < 17 ? "day" : "evening");
    };
    compute();
    const id = setInterval(compute, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return timeOfDay;
}
