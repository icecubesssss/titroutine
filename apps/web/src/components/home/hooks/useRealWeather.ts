import { useEffect, useState } from "react";
import { weatherFromCode } from "@/lib/companion";

// Real weather, once per session: silently ask for location (skip if denied) →
// Open-Meteo (no API key) → map the WMO code to rain/snow for the ambient
// scheduler. Any failure is ignored and the pet just falls back to time-of-day.
export function useRealWeather(): "rain" | "snow" | null {
  const [weather, setWeather] = useState<"rain" | "snow" | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=weather_code`
          );
          const json = await res.json();
          const code = json?.current?.weather_code;
          if (!cancelled && typeof code === "number") setWeather(weatherFromCode(code));
        } catch {
          /* mạng lỗi → bỏ qua, dùng sinh hoạt theo giờ/mùa */
        }
      },
      () => {/* từ chối vị trí → bỏ qua */},
      { timeout: 8000, maximumAge: 3_600_000 }
    );
    return () => { cancelled = true; };
  }, []);

  return weather;
}
