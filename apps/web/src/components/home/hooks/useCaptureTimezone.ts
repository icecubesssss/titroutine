import { useEffect } from "react";
import { updateTimezoneAction } from "@/app/[locale]/actions";

// Capture the user's real IANA timezone once so streaks roll over on their local
// day, not UTC. Only writes (and calls onCaptured) when it differs from what the
// server already has.
export function useCaptureTimezone(serverTimezone: string | null | undefined, onCaptured: () => void) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== serverTimezone) {
      updateTimezoneAction(tz).then(() => onCaptured());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverTimezone]);
}
