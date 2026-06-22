import { useCallback, useRef } from "react";
import { Howl } from "howler";

// Place sound files in public/assets/sounds/ (e.g. ting.mp3, swoosh.mp3).
// Loading is lazy and failure-tolerant: a missing or broken asset simply
// results in a no-op instead of an uncaught error.
const SOURCES = {
  ting: "/assets/sounds/ting.mp3",
  swoosh: "/assets/sounds/swoosh.mp3",
} as const;

type SoundName = keyof typeof SOURCES;

export const useSound = () => {
  const cache = useRef<Partial<Record<SoundName, Howl | null>>>({});

  const play = useCallback((name: SoundName, volume: number) => {
    if (cache.current[name] === undefined) {
      try {
        cache.current[name] = new Howl({
          src: [SOURCES[name]],
          volume,
          onloaderror: () => {
            cache.current[name] = null;
          },
        });
      } catch {
        cache.current[name] = null;
      }
    }
    cache.current[name]?.play();
  }, []);

  const playTing = useCallback(() => play("ting", 0.8), [play]);
  const playSwoosh = useCallback(() => play("swoosh", 0.5), [play]);

  return { playTing, playSwoosh };
};
