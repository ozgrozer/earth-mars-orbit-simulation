"use client";

import { create } from "zustand";
import {
  EARTH_YEAR_DAYS,
  SCENARIOS,
  SYNODIC_PERIOD_DAYS,
  TRANSFER_DAYS,
  type ScenarioId,
} from "@/lib/orbital";

/** Animation speed: sim days per real second */
export type SpeedPreset = 10 | 20 | 30 | 40 | 50;

interface SimulationState {
  /** Simulation time in days since t=0 (optimal alignment) */
  timeDays: number;
  /** Animation speed multiplier (sim days per real second) */
  speed: SpeedPreset;
  playing: boolean;
  scenarioId: ScenarioId;
  /** Show planned transfer path */
  showPath: boolean;
  /** Show phase-angle helper arc */
  showPhaseAngle: boolean;
  /** Right-hand UI panel visibility */
  panelOpen: boolean;
  /** Background music muted (animation can still play) */
  musicMuted: boolean;

  setTimeDays: (t: number) => void;
  setSpeed: (s: SpeedPreset) => void;
  setPlaying: (p: boolean) => void;
  togglePlaying: () => void;
  setScenario: (id: ScenarioId) => void;
  setShowPath: (v: boolean) => void;
  setShowPhaseAngle: (v: boolean) => void;
  setPanelOpen: (v: boolean) => void;
  togglePanel: () => void;
  setMusicMuted: (muted: boolean) => void;
  toggleMusicMuted: () => void;
  reset: () => void;
  tick: (dtSeconds: number) => void;
}

function scenarioById(id: ScenarioId) {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

/** Default start: a bit before launch so you see the approach */
function startTimeFor(id: ScenarioId): number {
  const s = scenarioById(id);
  if (id === "free-run") return 0;
  return Math.max(0, s.launchOffsetDays - 40);
}

export const useSimulation = create<SimulationState>((set, get) => ({
  timeDays: startTimeFor("optimal"),
  speed: 10,
  playing: true,
  scenarioId: "optimal",
  showPath: true,
  showPhaseAngle: true,
  panelOpen: true,
  musicMuted: false,

  setTimeDays: (timeDays) => set({ timeDays }),
  setSpeed: (speed) => set({ speed }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setScenario: (scenarioId) =>
    set({
      scenarioId,
      timeDays: startTimeFor(scenarioId),
      playing: true,
    }),
  setShowPath: (showPath) => set({ showPath }),
  setShowPhaseAngle: (showPhaseAngle) => set({ showPhaseAngle }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setMusicMuted: (musicMuted) => set({ musicMuted }),
  toggleMusicMuted: () => set((s) => ({ musicMuted: !s.musicMuted })),
  reset: () => {
    const { scenarioId } = get();
    set({ timeDays: startTimeFor(scenarioId), playing: true });
  },
  /** Time only moves forward — never loops or jumps planets back */
  tick: (dtSeconds) => {
    const { playing, speed, timeDays } = get();
    if (!playing) return;
    set({ timeDays: timeDays + dtSeconds * speed });
  },
}));

export function getActiveScenario(id: ScenarioId) {
  return scenarioById(id);
}

export function getLaunchDay(id: ScenarioId): number | null {
  if (id === "free-run") return null;
  return scenarioById(id).launchOffsetDays;
}

export { EARTH_YEAR_DAYS, SYNODIC_PERIOD_DAYS, TRANSFER_DAYS };
