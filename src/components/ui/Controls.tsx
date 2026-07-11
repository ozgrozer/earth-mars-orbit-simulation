"use client";

import {
  OPTIMAL_PHASE_ANGLE,
  SCENARIOS,
  SYNODIC_PERIOD_DAYS,
  TRANSFER_DAYS,
  angleDiff,
  earthAngleAt,
  formatAu,
  formatDays,
  marsAngleAt,
  missDistanceAu,
} from "@/lib/orbital";
import {
  getActiveScenario,
  getLaunchDay,
  useSimulation,
  type SpeedPreset,
} from "@/store/simulation";

const SPEEDS: { value: SpeedPreset; label: string }[] = [
  { value: 10, label: "10×" },
  { value: 20, label: "20×" },
  { value: 30, label: "30×" },
  { value: 40, label: "40×" },
  { value: 50, label: "50×" },
];

/** Shared style so Hide / Show panel match exactly */
const PANEL_TOGGLE_CLASS =
  "pointer-events-auto absolute right-3 top-3 z-20 rounded-full border border-white/15 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-slate-100 shadow-xl backdrop-blur-md transition hover:bg-slate-900/90 sm:right-5 sm:top-5";

export function Controls() {
  const timeDays = useSimulation((s) => s.timeDays);
  const speed = useSimulation((s) => s.speed);
  const playing = useSimulation((s) => s.playing);
  const scenarioId = useSimulation((s) => s.scenarioId);
  const showPath = useSimulation((s) => s.showPath);
  const showPhaseAngle = useSimulation((s) => s.showPhaseAngle);
  const panelOpen = useSimulation((s) => s.panelOpen);
  const setSpeed = useSimulation((s) => s.setSpeed);
  const togglePlaying = useSimulation((s) => s.togglePlaying);
  const setScenario = useSimulation((s) => s.setScenario);
  const setShowPath = useSimulation((s) => s.setShowPath);
  const setShowPhaseAngle = useSimulation((s) => s.setShowPhaseAngle);
  const togglePanel = useSimulation((s) => s.togglePanel);
  const reset = useSimulation((s) => s.reset);

  const scenario = getActiveScenario(scenarioId);
  const launchDay = getLaunchDay(scenarioId);

  const phaseDeg =
    (angleDiff(marsAngleAt(timeDays), earthAngleAt(timeDays)) * 180) /
    Math.PI;
  const optimalPhaseDeg = (OPTIMAL_PHASE_ANGLE * 180) / Math.PI;

  const missionPhase =
    launchDay === null
      ? "observing"
      : timeDays < launchDay
        ? "pre-launch"
        : timeDays < launchDay + TRANSFER_DAYS
          ? "transit"
          : scenario.succeeds
            ? "arrived"
            : "missed";

  const miss =
    launchDay !== null && scenarioId === "one-year-late"
      ? missDistanceAu(launchDay)
      : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-5">
      {/* Same position + style whether open or closed */}
      <button
        type="button"
        onClick={togglePanel}
        className={PANEL_TOGGLE_CLASS}
        aria-label={panelOpen ? "Hide panel" : "Show panel"}
      >
        {panelOpen ? "Hide ▶" : "◀ Show panel"}
      </button>

      {panelOpen && (
        <aside className="pointer-events-auto absolute bottom-3 right-3 top-14 flex w-[min(100%,22rem)] flex-col gap-2.5 overflow-y-auto sm:bottom-5 sm:right-5 sm:top-16 sm:w-[22rem]">
          {/* 1. Timeline */}
          <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-xl backdrop-blur-md">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Timeline
            </h2>
            <div className="flex flex-col gap-1.5">
              {SCENARIOS.map((s) => {
                const active = s.id === scenarioId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScenario(s.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? s.id === "optimal"
                          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                          : s.id === "one-year-late"
                            ? "border-rose-400/50 bg-rose-500/15 text-rose-100"
                            : "border-sky-400/50 bg-sky-500/15 text-sky-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{s.label}</span>
                      {s.id !== "free-run" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            s.succeeds
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {s.succeeds ? "hit" : "miss"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Playback */}
          <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-xl backdrop-blur-md">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Playback
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={togglePlaying}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <span className="text-sm">❚❚</span>
                ) : (
                  <span className="ml-0.5 text-sm">▶</span>
                )}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
              >
                Restart
              </button>
              <span className="text-[11px] text-slate-500">
                {speed} sim-days / sec
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Speed
              </span>
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSpeed(s.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    speed === s.value
                      ? "bg-amber-400 text-slate-950"
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* 3. Live telemetry */}
          <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-xl backdrop-blur-md">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Live telemetry
            </h2>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-slate-500">Sim time</dt>
                <dd className="font-mono text-slate-100">
                  day {timeDays.toFixed(0)}
                  <span className="ml-1 text-slate-500">
                    ({formatDays(timeDays)})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Mission</dt>
                <dd className="font-mono capitalize text-slate-100">
                  {missionPhase.replace("-", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phase angle</dt>
                <dd className="font-mono text-violet-300">
                  {phaseDeg.toFixed(1)}°
                  <span className="ml-1 text-slate-500">
                    (opt {optimalPhaseDeg.toFixed(0)}°)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Transfer</dt>
                <dd className="font-mono text-amber-300">
                  {Math.round(TRANSFER_DAYS)} days
                </dd>
              </div>
              {launchDay !== null && (
                <div className="col-span-2">
                  <dt className="text-slate-500">Launch day</dt>
                  <dd className="font-mono text-slate-100">
                    t = {launchDay.toFixed(0)} days from optimal window
                  </dd>
                </div>
              )}
              {miss !== null && missionPhase === "missed" && (
                <div className="col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5">
                  <dt className="text-rose-300/80">Miss distance at arrival</dt>
                  <dd className="font-mono text-sm text-rose-200">
                    {formatAu(miss)} (~{(miss * 149.6).toFixed(0)} million km)
                  </dd>
                </div>
              )}
              {missionPhase === "arrived" && (
                <div className="col-span-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5">
                  <dd className="text-sm text-emerald-200">
                    {scenario.outcome}
                  </dd>
                </div>
              )}
              {missionPhase === "missed" && (
                <div className="col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5">
                  <dd className="text-sm text-rose-200">{scenario.outcome}</dd>
                </div>
              )}
            </dl>

            <div className="mt-3 flex flex-wrap gap-3 border-t border-white/5 pt-3 text-xs text-slate-400">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPath}
                  onChange={(e) => setShowPath(e.target.checked)}
                  className="accent-amber-400"
                />
                Transfer path
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPhaseAngle}
                  onChange={(e) => setShowPhaseAngle(e.target.checked)}
                  className="accent-violet-400"
                />
                Phase angle
              </label>
            </div>
          </section>

          {/* 4. Info */}
          <section className="rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 py-3 shadow-xl backdrop-blur-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-400/90">
              Orbital mechanics lab
            </p>
            <h1 className="mt-0.5 text-base font-semibold tracking-tight text-white sm:text-lg">
              Earth → Mars launch windows
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              You can only fly a cheap path to Mars when Earth and Mars line up.
              That trip takes about {Math.round(TRANSFER_DAYS)} days. If Mars is
              on the far side of the Sun, there is no straight route — you
              cannot fly through the Sun. Launch a year late and the same rocket
              misses Mars by hundreds of millions of km.
            </p>
            <p className="mt-2 border-t border-white/10 pt-2 text-xs leading-relaxed text-slate-400">
              <strong className="text-slate-200">Why ~every 2 years?</strong>{" "}
              Earth orbits faster than Mars. The time until they sit in the
              right places again is the{" "}
              <em className="text-slate-300 not-italic">synodic period</em>:{" "}
              <span className="font-mono text-amber-200/90">
                1 / (1/P<sub>E</sub> − 1/P<sub>M</sub>) ≈{" "}
                {SYNODIC_PERIOD_DAYS.toFixed(0)} days
              </span>{" "}
              (~{formatDays(SYNODIC_PERIOD_DAYS)}, about 2.1 years). Wait only 1
              year and Mars is still roughly on the wrong side of its orbit —
              your transfer path ends empty.
            </p>
          </section>
        </aside>
      )}
    </div>
  );
}
