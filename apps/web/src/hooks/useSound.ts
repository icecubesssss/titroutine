import { useCallback } from 'react';
import { Howl } from 'howler';

// In a real scenario, you'll place these files in public/assets/sounds/
// e.g. public/assets/sounds/ting.mp3
const sounds = {
  ting: new Howl({ src: ['/assets/sounds/ting.mp3'], volume: 0.8 }),
  swoosh: new Howl({ src: ['/assets/sounds/swoosh.mp3'], volume: 0.5 }),
};

export const useSound = () => {
  const playTing = useCallback(() => {
    sounds.ting.play();
  }, []);

  const playSwoosh = useCallback(() => {
    sounds.swoosh.play();
  }, []);

  return { playTing, playSwoosh };
};
