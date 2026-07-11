"use client";

import dynamic from "next/dynamic";
import { BackgroundMusic } from "./BackgroundMusic";
import { LaunchSfx } from "./LaunchSfx";
import { Controls } from "./ui/Controls";

const SceneCanvas = dynamic(
  () =>
    import("./scene/SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm text-slate-400">
        Loading solar system…
      </div>
    ),
  }
);

export function SimulationApp() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-950">
      <BackgroundMusic />
      <LaunchSfx />
      <SceneCanvas />
      <Controls />
    </main>
  );
}
