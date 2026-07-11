/**
 * Starship booster launch SFX — play the public clip once with a smooth tail fade.
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LAUNCH_SRC = `${basePath}/rocket-booster-roar.mp3`;

/** Peak volume while the clip is playing (keep under the music) */
const PEAK_VOLUME = 0.38;

/** Seconds before the end to start fading out */
const FADE_OUT_SECONDS = 2.6;

let audio: HTMLAudioElement | null = null;
let fadeRaf: number | null = null;
let onEnded: (() => void) | null = null;

function getLaunchAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(LAUNCH_SRC);
    audio.preload = "auto";
    audio.loop = false;
  }
  return audio;
}

function cancelFade() {
  if (fadeRaf !== null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

/** Stop the booster immediately */
export function stopLaunchSfx(): void {
  cancelFade();
  const el = audio;
  if (!el) return;
  if (onEnded) {
    el.removeEventListener("ended", onEnded);
    onEnded = null;
  }
  el.pause();
  el.currentTime = 0;
  el.volume = PEAK_VOLUME;
}

/**
 * Play the booster roar once; smoothly lower volume over the last ~2.6s.
 * @param volume optional peak 0–1 (default is deliberately quiet)
 */
export function playLaunchSfx(volume = PEAK_VOLUME): void {
  const el = getLaunchAudio();
  if (!el) return;

  stopLaunchSfx();

  const peak = Math.max(0, Math.min(1, volume));
  el.loop = false;
  el.volume = peak;
  el.muted = false;
  el.currentTime = 0;

  const startFadeLoop = () => {
    cancelFade();
    const tick = () => {
      if (el.paused) {
        fadeRaf = null;
        return;
      }

      const duration = el.duration;
      if (Number.isFinite(duration) && duration > 0) {
        const remaining = duration - el.currentTime;
        if (remaining > FADE_OUT_SECONDS) {
          el.volume = peak;
        } else {
          // Cosine ease peak → 0 over the last FADE_OUT_SECONDS
          const t = Math.max(0, Math.min(1, remaining / FADE_OUT_SECONDS));
          const gain = 0.5 - 0.5 * Math.cos(Math.PI * t);
          el.volume = peak * gain;
        }
      }

      fadeRaf = requestAnimationFrame(tick);
    };
    fadeRaf = requestAnimationFrame(tick);
  };

  onEnded = () => {
    stopLaunchSfx();
  };
  el.addEventListener("ended", onEnded);

  void el
    .play()
    .then(() => {
      startFadeLoop();
    })
    .catch(() => {
      // Needs a prior user gesture if autoplay is blocked
    });
}
