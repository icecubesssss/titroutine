"use client";

import { useEffect, useState } from "react";

/**
 * True on touch-primary devices (phones/tablets with no precise mouse). Uses the
 * canonical "(hover: none) and (pointer: coarse)" query — landscape-safe, and it
 * excludes desktops and laptops-with-a-mouse. Gates the strict focus timer, which
 * relies on the device-orientation ("flip face-down") sensor desktops don't have.
 * SSR-safe: starts false, resolves on mount.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}
