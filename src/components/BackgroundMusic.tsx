"use client";

import { useEffect, useRef } from "react";
import { useSimulation } from "@/store/simulation";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TRACK_SRC = `${basePath}/red-dust-transit.mp3`;
const VOLUME = 0.4;

/**
 * Background score for the simulation.
 * - Plays continuously while `playing` is true
 * - Pauses only when the user hits Pause (not on Restart)
 * - Mute silences audio without stopping the track position
 * - Attempts autoplay on load; if the browser blocks it, unlocks on first gesture
 */
export function BackgroundMusic() {
  const playing = useSimulation((s) => s.playing);
  const musicMuted = useSimulation((s) => s.musicMuted);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  // Create the shared Audio element once
  useEffect(() => {
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = VOLUME;
    audio.muted = useSimulation.getState().musicMuted;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Mute / unmute without interrupting playback position
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = musicMuted;
  }, [musicMuted]);

  // Keep audio in sync with play/pause only — Restart leaves the track running
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!playing) {
      audio.pause();
      return;
    }

    let cancelled = false;
    const unlockListeners: Array<() => void> = [];

    const removeUnlockListeners = () => {
      for (const off of unlockListeners) off();
      unlockListeners.length = 0;
    };

    const tryPlay = () => {
      if (cancelled || !useSimulation.getState().playing) return;
      void audio
        .play()
        .then(() => {
          unlockedRef.current = true;
          removeUnlockListeners();
        })
        .catch(() => {
          // Autoplay blocked until a user gesture
        });
    };

    tryPlay();

    if (!unlockedRef.current) {
      const unlock = () => tryPlay();
      window.addEventListener("pointerdown", unlock);
      window.addEventListener("keydown", unlock);
      unlockListeners.push(
        () => window.removeEventListener("pointerdown", unlock),
        () => window.removeEventListener("keydown", unlock)
      );
    }

    return () => {
      cancelled = true;
      removeUnlockListeners();
    };
  }, [playing]);

  return null;
}
