"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Pause, Play, PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const SPEEDS: { value: SpeedPreset; label: string }[] = [
  { value: 10, label: "10×" },
  { value: 20, label: "20×" },
  { value: 30, label: "30×" },
  { value: 40, label: "40×" },
  { value: 50, label: "50×" },
];

const SCENARIO_ACCENT: Record<string, string> = {
  optimal: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  "one-year-late": "border-rose-400/50 bg-rose-500/15 text-rose-100",
  "free-run": "border-sky-400/50 bg-sky-500/15 text-sky-100",
};

function PanelCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "shrink-0 overflow-visible border-0 bg-card/80 py-2.5 shadow-xl ring-1 ring-white/10 backdrop-blur-md",
        className
      )}
    >
      <CardHeader className="gap-0 pb-0 pt-0">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible pt-1.5">{children}</CardContent>
    </Card>
  );
}

export function Controls() {
  const scrollRef = useRef<HTMLElement>(null);

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

  // Force wheel scrolling on the panel. OrbitControls / the canvas can otherwise
  // swallow wheel events even when the pointer is over the overlay.
  useEffect(() => {
    if (!panelOpen) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [panelOpen]);

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
    <div className="pointer-events-none absolute inset-0 z-50">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={togglePanel}
        className="pointer-events-auto absolute right-3 top-3 z-20 rounded-full border-white/15 bg-card/85 px-3 shadow-xl backdrop-blur-md sm:right-5 sm:top-5"
        aria-label={panelOpen ? "Hide panel" : "Show panel"}
      >
        {panelOpen ? (
          <>
            Hide
            <PanelRightClose data-icon="inline-end" />
          </>
        ) : (
          <>
            <PanelRightOpen data-icon="inline-start" />
            Show panel
          </>
        )}
      </Button>

      {panelOpen && (
        <aside
          ref={scrollRef}
          className="panel-scroll pointer-events-auto absolute right-3 top-14 w-[min(100%-1.5rem,22rem)] sm:right-5 sm:top-16 sm:w-[22rem]"
          style={{
            // Explicit height so overflow scrolling always has a bounded box
            maxHeight: "calc(100dvh - 4.5rem)",
            height: "calc(100dvh - 4.5rem)",
            overflowY: "scroll",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2 pb-4">
            {/* Timeline */}
            <PanelCard title="Timeline">
              <div className="flex flex-col gap-1.5">
                {SCENARIOS.map((s) => {
                  const active = s.id === scenarioId;
                  return (
                    <Button
                      key={s.id}
                      type="button"
                      variant="outline"
                      onClick={() => setScenario(s.id)}
                      className={cn(
                        "h-auto min-h-9 w-full justify-between gap-2 rounded-xl px-3 py-2 text-left font-normal whitespace-normal",
                        active
                          ? SCENARIO_ACCENT[s.id]
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:bg-white/10 hover:text-foreground"
                      )}
                    >
                      <span className="min-w-0 flex-1 text-sm leading-snug font-medium">
                        {s.label}
                      </span>
                      {s.id !== "free-run" && (
                        <Badge
                          variant={s.succeeds ? "secondary" : "destructive"}
                          className={cn(
                            "shrink-0 uppercase",
                            s.succeeds &&
                              "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
                          )}
                        >
                          {s.succeeds ? "hit" : "miss"}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </PanelCard>

            {/* Playback */}
            <PanelCard title="Playback">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={togglePlaying}
                  className="rounded-full"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause /> : <Play />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="rounded-full border-white/10"
                >
                  <RotateCcw data-icon="inline-start" />
                  Restart
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {speed} sim-days / sec
                </span>
              </div>

              <div className="mt-2.5 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Speed
                </span>
                <ToggleGroup
                  value={[String(speed)]}
                  onValueChange={(values) => {
                    const next = values[0];
                    if (next) setSpeed(Number(next) as SpeedPreset);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex w-full flex-wrap gap-1"
                >
                  {SPEEDS.map((s) => (
                    <ToggleGroupItem
                      key={s.value}
                      value={String(s.value)}
                      className="min-w-[2.75rem] flex-1 data-pressed:bg-primary data-pressed:text-primary-foreground data-pressed:hover:bg-primary/90"
                    >
                      {s.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </PanelCard>

            {/* Live telemetry */}
            <PanelCard title="Live telemetry">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Sim time</dt>
                  <dd className="font-mono break-words text-foreground">
                    day {timeDays.toFixed(0)}
                    <span className="ml-1 text-muted-foreground">
                      ({formatDays(timeDays)})
                    </span>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Mission</dt>
                  <dd className="font-mono capitalize text-foreground">
                    {missionPhase.replace("-", " ")}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Phase angle</dt>
                  <dd className="font-mono break-words text-violet-300">
                    {phaseDeg.toFixed(1)}°
                    <span className="ml-1 text-muted-foreground">
                      (opt {optimalPhaseDeg.toFixed(0)}°)
                    </span>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Transfer</dt>
                  <dd className="font-mono text-amber-300">
                    {Math.round(TRANSFER_DAYS)} days
                  </dd>
                </div>
                {launchDay !== null && (
                  <div className="col-span-2 min-w-0">
                    <dt className="text-muted-foreground">Launch day</dt>
                    <dd className="font-mono break-words text-foreground">
                      t = {launchDay.toFixed(0)} days from optimal window
                    </dd>
                  </div>
                )}
                {miss !== null && missionPhase === "missed" && (
                  <div className="col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5">
                    <dt className="text-rose-300/80">Miss distance at arrival</dt>
                    <dd className="font-mono text-sm break-words text-rose-200">
                      {formatAu(miss)} (~{(miss * 149.6).toFixed(0)} million km)
                    </dd>
                  </div>
                )}
                {missionPhase === "arrived" && (
                  <div className="col-span-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5">
                    <dd className="text-sm leading-snug break-words text-emerald-200">
                      {scenario.outcome}
                    </dd>
                  </div>
                )}
                {missionPhase === "missed" && (
                  <div className="col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5">
                    <dd className="text-sm leading-snug break-words text-rose-200">
                      {scenario.outcome}
                    </dd>
                  </div>
                )}
              </dl>

              <Separator className="my-2.5 bg-white/10" />

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="show-path"
                    className="cursor-pointer text-xs font-normal text-muted-foreground"
                  >
                    Transfer path
                  </Label>
                  <Switch
                    id="show-path"
                    size="sm"
                    checked={showPath}
                    onCheckedChange={setShowPath}
                    className="data-checked:bg-amber-400"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="show-phase"
                    className="cursor-pointer text-xs font-normal text-muted-foreground"
                  >
                    Phase angle
                  </Label>
                  <Switch
                    id="show-phase"
                    size="sm"
                    checked={showPhaseAngle}
                    onCheckedChange={setShowPhaseAngle}
                    className="data-checked:bg-violet-400"
                  />
                </div>
              </div>
            </PanelCard>

            {/* Info */}
            <PanelCard title="Earth → Mars launch windows">
              <div className="space-y-2">
                <p className="text-xs leading-relaxed break-words text-muted-foreground">
                  You can only fly a cheap path to Mars when Earth and Mars line
                  up. That trip takes about {Math.round(TRANSFER_DAYS)} days. If
                  Mars is on the far side of the Sun, there is no straight route —
                  you cannot fly through the Sun. Launch a year late and the same
                  rocket misses Mars by hundreds of millions of km.
                </p>
                <Separator className="bg-white/10" />
                <p className="text-xs leading-relaxed break-words text-muted-foreground">
                  <strong className="text-foreground">Why ~every 2 years?</strong>{" "}
                  Earth orbits faster than Mars. The time until they sit in the
                  right places again is the{" "}
                  <em className="not-italic text-foreground/80">
                    synodic period
                  </em>
                  :{" "}
                  <span className="font-mono text-amber-200/90">
                    1 / (1/P<sub>E</sub> − 1/P<sub>M</sub>) ≈{" "}
                    {SYNODIC_PERIOD_DAYS.toFixed(0)} days
                  </span>{" "}
                  (~{formatDays(SYNODIC_PERIOD_DAYS)}, about 2.1 years). Wait only
                  1 year and Mars is still roughly on the wrong side of its orbit —
                  your transfer path ends empty.
                </p>
              </div>
            </PanelCard>
          </div>
        </aside>
      )}
    </div>
  );
}
