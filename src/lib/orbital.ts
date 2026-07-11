/**
 * Orbital mechanics for Earth–Mars Hohmann transfers.
 * Distances in AU, time in Earth days, angles in radians.
 */

export const AU = 1; // scene units = AU
export const EARTH_ORBIT_AU = 1.0;
export const MARS_ORBIT_AU = 1.524;
export const EARTH_YEAR_DAYS = 365.25;
export const MARS_YEAR_DAYS = 686.98;

/** Synodic period: how often Earth "laps" Mars → launch windows */
export const SYNODIC_PERIOD_DAYS =
  1 / (1 / EARTH_YEAR_DAYS - 1 / MARS_YEAR_DAYS); // ≈ 779.9 days ≈ 2.14 years

export const EARTH_ANGULAR_SPEED = (2 * Math.PI) / EARTH_YEAR_DAYS;
export const MARS_ANGULAR_SPEED = (2 * Math.PI) / MARS_YEAR_DAYS;

/** Hohmann transfer semi-major axis (AU) */
export const TRANSFER_A = (EARTH_ORBIT_AU + MARS_ORBIT_AU) / 2;

/** Hohmann transfer time (half ellipse period) in days */
export const TRANSFER_DAYS =
  0.5 *
  EARTH_YEAR_DAYS *
  Math.pow(TRANSFER_A / EARTH_ORBIT_AU, 1.5); // ≈ 258.9 days

/**
 * Phase angle at departure for a Hohmann transfer.
 * Mars should lead Earth by this angle so they meet at arrival.
 * θ = π − ω_mars × t_transfer
 */
export const OPTIMAL_PHASE_ANGLE =
  Math.PI - MARS_ANGULAR_SPEED * TRANSFER_DAYS; // ≈ 44°

export type ScenarioId = "optimal" | "one-year-late" | "free-run";

export interface Scenario {
  id: ScenarioId;
  label: string;
  shortLabel: string;
  description: string;
  /** Days after optimal window when rocket launches (0 = optimal) */
  launchOffsetDays: number;
  /** Whether the rocket can intercept Mars */
  succeeds: boolean;
  outcome: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "optimal",
    label: "Optimal window (aligned)",
    shortLabel: "Optimal",
    description:
      "Earth and Mars are in the right positions. The rocket rides a Hohmann ellipse and meets Mars ~259 days later. This geometry repeats about every 26 months.",
    launchOffsetDays: 0,
    succeeds: true,
    outcome:
      "Mission success — rocket intercepts Mars after a 259-day transfer.",
  },
  {
    id: "one-year-late",
    label: "Launch 1 year late",
    shortLabel: "1 year late",
    description:
      "Same rocket, same burn, but planets have moved. Earth has gone ~1 full orbit; Mars only ~½. The transfer ellipse no longer ends where Mars will be — you miss by a huge distance.",
    launchOffsetDays: EARTH_YEAR_DAYS,
    succeeds: false,
    outcome:
      "Mission fail — Mars is on the wrong side of the Sun when the rocket arrives. You can’t fly through the Sun to catch up.",
  },
  {
    id: "free-run",
    label: "Watch orbits only",
    shortLabel: "Orbits",
    description:
      "No launch — just Earth and Mars orbiting the Sun. Notice how Earth (inner, faster) periodically catches up to the right geometry for a transfer window.",
    launchOffsetDays: 0,
    succeeds: false,
    outcome: "Observe the relative motion that creates ~2-year launch windows.",
  },
];

export function planetPosition(
  radiusAu: number,
  angleRad: number
): [number, number, number] {
  return [Math.cos(angleRad) * radiusAu, 0, Math.sin(angleRad) * radiusAu];
}

/** Normalize angle to [0, 2π) */
export function normalizeAngle(a: number): number {
  const twoPi = 2 * Math.PI;
  return ((a % twoPi) + twoPi) % twoPi;
}

/** Shortest signed angular difference a − b in (−π, π] */
export function angleDiff(a: number, b: number): number {
  return normalizeAngle(a - b + Math.PI) - Math.PI;
}

/**
 * Earth starts at angle 0. Mars starts so that at t=0 (optimal launch)
 * the phase angle is OPTIMAL_PHASE_ANGLE (Mars leads Earth).
 */
export function earthAngleAt(tDays: number): number {
  return normalizeAngle(EARTH_ANGULAR_SPEED * tDays);
}

export function marsAngleAt(tDays: number): number {
  // At t=0: Earth at 0, Mars at OPTIMAL_PHASE_ANGLE
  return normalizeAngle(OPTIMAL_PHASE_ANGLE + MARS_ANGULAR_SPEED * tDays);
}

/** Full period of the transfer ellipse (outbound + return to perihelion) */
export const TRANSFER_ORBIT_PERIOD_DAYS = TRANSFER_DAYS * 2;

/**
 * Hohmann transfer / coast position on the transfer ellipse.
 * Launches from Earth at t = launchDay (perihelion). True anomaly advances
 * linearly so ν = π at Mars orbit after TRANSFER_DAYS.
 *
 * After that (no capture burn), the ship keeps coasting on the same ellipse
 * around the Sun — it does not freeze at the miss point.
 */
export function transferPosition(
  tDays: number,
  launchDay: number
): [number, number, number] | null {
  const tau = tDays - launchDay;
  if (tau < 0) return null;

  // ν = 0 at launch, π at Mars-orbit aphelion, 2π back at perihelion, then repeats
  const nu = (tau / TRANSFER_DAYS) * Math.PI;

  const a = TRANSFER_A;
  const e = (MARS_ORBIT_AU - EARTH_ORBIT_AU) / (MARS_ORBIT_AU + EARTH_ORBIT_AU);
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));

  // Orient ellipse so perihelion is at Earth's launch position
  const launchAngle = earthAngleAt(launchDay);
  const x = r * Math.cos(nu);
  const z = r * Math.sin(nu);

  // Rotate by launchAngle around Y
  const cos = Math.cos(launchAngle);
  const sin = Math.sin(launchAngle);
  return [x * cos - z * sin, 0, x * sin + z * cos];
}

/** Sample points along the planned transfer path (full half-ellipse) */
export function transferPathPoints(
  launchDay: number,
  samples = 128
): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = launchDay + (i / samples) * TRANSFER_DAYS;
    const p = transferPosition(t, launchDay);
    if (p) points.push(p);
  }
  return points;
}

/** Distance between rocket and Mars at arrival (AU) */
export function missDistanceAu(launchDay: number): number {
  const arrival = launchDay + TRANSFER_DAYS;
  const rocket = transferPosition(arrival, launchDay);
  const mars = planetPosition(MARS_ORBIT_AU, marsAngleAt(arrival));
  if (!rocket) return Infinity;
  const dx = rocket[0] - mars[0];
  const dz = rocket[2] - mars[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function formatDays(days: number): string {
  if (days < 0) {
    const d = Math.abs(days);
    if (d < 1) return `T−${Math.round(d * 24)}h`;
    return `T−${Math.round(d)} days`;
  }
  if (days < 1) return `${Math.round(days * 24)} hours`;
  if (days < 60) return `${Math.round(days)} days`;
  const years = days / EARTH_YEAR_DAYS;
  if (years < 2) return `${(days / 30.44).toFixed(1)} months`;
  return `${years.toFixed(2)} years`;
}

export function formatAu(au: number): string {
  if (au < 0.01) return `${(au * 149597870.7).toFixed(0)} km`;
  return `${au.toFixed(3)} AU`;
}
