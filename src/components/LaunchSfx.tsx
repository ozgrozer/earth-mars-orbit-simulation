"use client";

import { useEffect, useRef } from "react";
import { playLaunchSfx, stopLaunchSfx } from "@/lib/launch-sfx";
import { getLaunchDay, useSimulation } from "@/store/simulation";

/**
 * Plays the booster roar once when sim-time crosses launch day.
 * Stops on mute, pause, scenario change, or free-run.
 */
export function LaunchSfx() {
  const timeDays = useSimulation((s) => s.timeDays);
  const scenarioId = useSimulation((s) => s.scenarioId);
  const musicMuted = useSimulation((s) => s.musicMuted);
  const playing = useSimulation((s) => s.playing);
  const prevTimeRef = useRef(timeDays);
  const scenarioRef = useRef(scenarioId);

  // Mute or pause → cut the booster immediately
  useEffect(() => {
    if (musicMuted || !playing) {
      stopLaunchSfx();
    }
  }, [musicMuted, playing]);

  useEffect(() => {
    // Scenario change: re-baseline and stop any ongoing roar
    if (scenarioRef.current !== scenarioId) {
      scenarioRef.current = scenarioId;
      prevTimeRef.current = timeDays;
      stopLaunchSfx();
      return;
    }

    const launchDay = getLaunchDay(scenarioId);
    const prev = prevTimeRef.current;
    prevTimeRef.current = timeDays;

    if (launchDay === null) return;
    if (musicMuted || !playing) return;

    // Edge: time stepped across launch (works at any speed preset)
    if (prev < launchDay && timeDays >= launchDay) {
      playLaunchSfx();
    }
  }, [timeDays, scenarioId, musicMuted, playing]);

  // Cleanup on unmount
  useEffect(() => () => stopLaunchSfx(), []);

  return null;
}
