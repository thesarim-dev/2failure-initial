import { useCallback, useState } from 'react';

/**
 * Soft, high-pitched feedback sounds made with the Web Audio API: no audio
 * files to download or license. Every sound is a few short sine/triangle
 * notes with a quick fade, kept quiet so they feel like gentle chimes.
 *
 * Browsers only allow audio after the person has interacted with the page,
 * which is always true here because sounds play in response to taps.
 */

const SOUND_KEY = '2failure-sound-on';

export function isSoundOn(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function useSoundSetting() {
  const [on, setOn] = useState(isSoundOn);
  const toggle = useCallback(() => {
    setOn((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
      } catch {
        // Ignore storage failures.
      }
      if (next) fx.tick();
      return next;
    });
  }, []);
  return { soundOn: on, toggleSound: toggle };
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined' || !isSoundOn()) return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    // A short echo makes the chimes feel softer and rounder.
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.11;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.22;
    master.connect(ctx.destination);
    master.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

type Note = { f: number; at?: number; dur?: number; type?: OscillatorType; gain?: number; slideTo?: number };

function play(notes: Note[]) {
  const a = audio();
  if (!a) return;
  const now = a.ctx.currentTime + 0.01;
  for (const n of notes) {
    const start = now + (n.at ?? 0);
    const dur = n.dur ?? 0.12;
    const osc = a.ctx.createOscillator();
    const env = a.ctx.createGain();
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.f, start);
    if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, start + dur);
    const peak = n.gain ?? 0.06;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env);
    env.connect(a.out);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
}

let noiseBuffer: AudioBuffer | null = null;

/** A short burst of filtered noise: the "body" of an impact (a strike, a knock). */
function noise({
  at = 0,
  dur = 0.08,
  filter = 'bandpass',
  freq = 2000,
  q = 1,
  gain = 0.05
}: {
  at?: number;
  dur?: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
  gain?: number;
}) {
  const a = audio();
  if (!a) return;
  if (!noiseBuffer) {
    noiseBuffer = a.ctx.createBuffer(1, Math.floor(a.ctx.sampleRate * 0.5), a.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const start = a.ctx.currentTime + 0.01 + at;
  const src = a.ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const bq = a.ctx.createBiquadFilter();
  bq.type = filter;
  bq.frequency.value = freq;
  bq.Q.value = q;
  const env = a.ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(bq);
  bq.connect(env);
  env.connect(a.out);
  src.start(start);
  src.stop(start + dur + 0.02);
}

/** A tiny vibration on phones that support it (most Android devices). */
function haptic(ms: number | number[]) {
  if (!isSoundOn()) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not supported.
  }
}

// Notes (Hz): high, bright register.
const C6 = 1046.5;
const E6 = 1318.5;
const G6 = 1568;
const A6 = 1760;
const C7 = 2093;
const E7 = 2637;
const G5 = 784;
const C5 = 523.25;
const E5 = 659.25;

export const fx = {
  /**
   * Train tab: an anvil being set down. A bright metallic strike (noise) with
   * a few inharmonic ringing partials, like struck iron, over a low thunk.
   */
  trainTab() {
    noise({ dur: 0.05, filter: 'highpass', freq: 2500, gain: 0.05 });
    noise({ dur: 0.09, filter: 'lowpass', freq: 400, gain: 0.08 });
    play([
      { f: 150, dur: 0.12, gain: 0.07, slideTo: 90 },
      { f: 1180, dur: 0.45, type: 'triangle', gain: 0.022 },
      { f: 1873, dur: 0.38, gain: 0.018 },
      { f: 2690, dur: 0.3, gain: 0.014 },
      { f: 3510, dur: 0.22, gain: 0.01 }
    ]);
    haptic(14);
  },
  /** Base tab: "thud thud thud", three soft hammer knocks of something being built. */
  baseTab() {
    [0, 0.13, 0.26].forEach((at, i) => {
      noise({ at, dur: 0.07, filter: 'lowpass', freq: 600 - i * 60, gain: 0.07 });
      noise({ at, dur: 0.025, filter: 'bandpass', freq: 1500, q: 2, gain: 0.03 });
      play([{ f: 130 - i * 8, at, dur: 0.11, gain: 0.08, slideTo: 70 }]);
    });
    haptic([10, 90, 10, 90, 10]);
  },
  /** A light tick for small taps (tabs, toggles). */
  tick() {
    play([{ f: E7, dur: 0.05, type: 'triangle', gain: 0.025 }]);
  },
  /** Starting a workout: a quick rising two-note. */
  start() {
    play([
      { f: G6, dur: 0.09, gain: 0.05 },
      { f: C7, at: 0.07, dur: 0.14, gain: 0.05 }
    ]);
    haptic(12);
  },
  /** Finishing a set. */
  tap() {
    play([{ f: C6, dur: 0.08, type: 'triangle', gain: 0.05, slideTo: G6 }]);
    haptic(10);
  },
  /** Workout complete: a bright rising arpeggio. */
  success() {
    play([
      { f: C6, dur: 0.14, type: 'triangle', gain: 0.055 },
      { f: E6, at: 0.08, dur: 0.14, type: 'triangle', gain: 0.055 },
      { f: G6, at: 0.16, dur: 0.16, type: 'triangle', gain: 0.055 },
      { f: C7, at: 0.24, dur: 0.32, gain: 0.05 }
    ]);
    haptic([12, 40, 18]);
  },
  /** Coins or materials: two quick sparkly notes. */
  coin() {
    play([
      { f: G6, dur: 0.07, gain: 0.045 },
      { f: E7, at: 0.06, dur: 0.16, gain: 0.04 }
    ]);
  },
  /** A personal record or a new trophy: a little sparkle. */
  record() {
    [C7, E7, G6, E7, C7 * 1.5].forEach((f, i) => play([{ f, at: i * 0.055, dur: 0.12, gain: 0.03 }]));
    haptic(16);
  },
  /** Placing or upgrading something in the base: a soft pop. */
  place() {
    play([
      { f: G5, dur: 0.08, gain: 0.06, slideTo: C6 },
      { f: E6, at: 0.05, dur: 0.12, type: 'triangle', gain: 0.035 }
    ]);
    haptic(8);
  },
  /** Base level up: a longer fanfare with a sparkle on top. */
  levelUp() {
    play([
      { f: G5, dur: 0.16, type: 'triangle', gain: 0.05 },
      { f: C6, at: 0.1, dur: 0.16, type: 'triangle', gain: 0.05 },
      { f: E6, at: 0.2, dur: 0.16, type: 'triangle', gain: 0.05 },
      { f: G6, at: 0.3, dur: 0.18, type: 'triangle', gain: 0.05 },
      { f: C7, at: 0.42, dur: 0.5, gain: 0.05 },
      { f: E7, at: 0.5, dur: 0.4, gain: 0.025 }
    ]);
    haptic([15, 50, 15, 50, 30]);
  },
  /** Rest day: calm and low-key. */
  rest() {
    play([
      { f: C5, dur: 0.5, gain: 0.045 },
      { f: E5, at: 0.12, dur: 0.55, gain: 0.04 },
      { f: G5, at: 0.24, dur: 0.6, gain: 0.035 }
    ]);
  },
  /** Something can't be done: a gentle, soft "nope" (never harsh). */
  error() {
    play([
      { f: E5, dur: 0.1, gain: 0.04 },
      { f: C5, at: 0.09, dur: 0.14, gain: 0.04 }
    ]);
    haptic(20);
  },
  /** A soft confirm for purchases and saves. */
  confirm() {
    play([
      { f: E6, dur: 0.08, gain: 0.045 },
      { f: A6, at: 0.06, dur: 0.14, gain: 0.045 }
    ]);
    haptic(10);
  }
};
