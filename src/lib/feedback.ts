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

let ctx: BaseAudioContext | null = null;
let master: GainNode | null = null;
/** Seconds added to every scheduled sound (used when rendering previews offline). */
let timeOffset = 0;

/**
 * Builds the output chain on a context: a dry path plus a soft room reverb
 * (a generated impulse response), both through a gentle compressor so
 * layered sounds never get harsh or clip.
 */
function buildChain(c: BaseAudioContext): GainNode {
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.004;
  comp.release.value = 0.2;
  // Safety limiter: transparent below ~-4.5 dB, then a soft curve that can
  // never exceed full scale, so rare overlapping peaks never clip harshly.
  const limiter = c.createWaveShaper();
  const curve = new Float32Array(4096);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    const m = Math.abs(x);
    curve[i] = Math.sign(x) * (m < 0.6 ? m : 0.6 + 0.4 * Math.tanh((m - 0.6) / 0.4));
  }
  limiter.curve = curve;
  limiter.oversample = '2x';
  comp.connect(limiter);
  limiter.connect(c.destination);
  const bus = c.createGain();
  bus.gain.value = 1.3;
  bus.connect(comp);
  // Room: 1.3 s of softly decaying stereo noise.
  const len = Math.floor(c.sampleRate * 1.3);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  const verb = c.createConvolver();
  verb.buffer = ir;
  const wet = c.createGain();
  wet.gain.value = 0.2;
  bus.connect(verb);
  verb.connect(wet);
  wet.connect(comp);
  return bus;
}

function audio(): { ctx: BaseAudioContext; out: GainNode } | null {
  if (typeof window === 'undefined' || !isSoundOn()) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = buildChain(ctx);
  }
  if (typeof AudioContext !== 'undefined' && ctx instanceof AudioContext && ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

/** The shared audio context and output (for the ambient soundscape). */
export function audioOut(): { ctx: BaseAudioContext; out: GainNode } | null {
  return audio();
}

/** A little variation per play so repeated sounds never feel robotic. */
const humanize = () => ({ detune: (Math.random() - 0.5) * 24, pan: (Math.random() - 0.5) * 0.4 });

type Voice = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'bell' | 'wood';
type Note = { f: number; at?: number; dur?: number; type?: Voice; gain?: number; slideTo?: number };

/** Bell: inharmonic partials that ring and fade (higher ones fade faster). */
const BELL = [
  [1, 1, 1],
  [2.76, 0.42, 0.7],
  [5.4, 0.22, 0.5],
  [8.93, 0.1, 0.32]
];

function play(notes: Note[]) {
  const a = audio();
  if (!a) return;
  const h = humanize();
  const now = a.ctx.currentTime + 0.01 + timeOffset;
  const pan = a.ctx.createStereoPanner();
  pan.pan.value = h.pan;
  pan.connect(a.out);
  for (const n of notes) {
    const start = now + (n.at ?? 0);
    const dur = n.dur ?? 0.12;
    const peak = n.gain ?? 0.06;
    const partials = n.type === 'bell' ? BELL : n.type === 'wood' ? [[1, 1, 1], [2.3, 0.35, 0.4], [4.1, 0.12, 0.25]] : [[1, 1, 1]];
    for (const [ratio, g, life] of partials) {
      // Skip overtones near the top of the audible range: they'd alias into a harsh sizzle.
      if (n.f * ratio > 15000) continue;
      const osc = a.ctx.createOscillator();
      const env = a.ctx.createGain();
      env.gain.value = 0; // silent until its fade-in (avoids a click on sub-sample starts)
      osc.type = n.type === 'bell' || n.type === 'wood' ? 'sine' : (n.type ?? 'sine');
      osc.frequency.setValueAtTime(n.f * ratio, start);
      osc.detune.value = h.detune;
      if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo * ratio, start + dur);
      const end = start + dur * life;
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(peak * g, start + (n.type === 'wood' ? 0.002 : 0.006));
      env.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(env);
      env.connect(pan);
      osc.start(start);
      osc.stop(end + 0.05);
    }
  }
}

let noiseBuffer: AudioBuffer | null = null;
let noiseFor: BaseAudioContext | null = null;

/** A short burst of filtered noise: the "body" of an impact (a strike, a knock, a whoosh). */
function noise({
  at = 0,
  dur = 0.08,
  filter = 'bandpass',
  freq = 2000,
  freqTo,
  q = 1,
  gain = 0.05
}: {
  at?: number;
  dur?: number;
  filter?: BiquadFilterType;
  freq?: number;
  freqTo?: number;
  q?: number;
  gain?: number;
}) {
  const a = audio();
  if (!a) return;
  if (!noiseBuffer || noiseFor !== a.ctx) {
    noiseBuffer = a.ctx.createBuffer(1, Math.floor(a.ctx.sampleRate * 0.5), a.ctx.sampleRate);
    noiseFor = a.ctx;
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const start = a.ctx.currentTime + 0.01 + at + timeOffset;
  const src = a.ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const bq = a.ctx.createBiquadFilter();
  bq.type = filter;
  bq.frequency.setValueAtTime(freq, start);
  if (freqTo) bq.frequency.exponentialRampToValueAtTime(freqTo, start + dur);
  bq.Q.value = q;
  const env = a.ctx.createGain();
  env.gain.value = 0;
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.02, dur / 3));
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(bq);
  bq.connect(env);
  env.connect(a.out);
  src.start(start);
  src.stop(start + dur + 0.02);
}

/**
 * Renders a list of sounds into an AudioBuffer offline (for previews and
 * level checks). Each entry plays at its own time.
 */
export async function renderSoundsOffline(entries: Array<{ at: number; play: () => void }>, seconds: number): Promise<AudioBuffer> {
  const off = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  const prev = { ctx, master };
  ctx = off;
  master = buildChain(off);
  try {
    for (const e of entries) {
      timeOffset = e.at;
      e.play();
    }
  } finally {
    timeOffset = 0;
  }
  const buffer = await off.startRendering();
  ctx = prev.ctx;
  master = prev.master;
  return buffer;
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
  /** Train tab: an anvil set down: a metallic strike ringing over a low thunk. */
  trainTab() {
    noise({ dur: 0.05, filter: 'highpass', freq: 2500, gain: 0.04 });
    noise({ dur: 0.1, filter: 'lowpass', freq: 380, gain: 0.07 });
    play([
      { f: 150, dur: 0.14, gain: 0.07, slideTo: 90 },
      { f: 1180, dur: 0.7, type: 'bell', gain: 0.022 }
    ]);
    haptic(14);
  },
  /** Base tab: three soft hammer knocks of something being built. */
  baseTab() {
    [0, 0.13, 0.26].forEach((at, i) => {
      noise({ at, dur: 0.08, filter: 'lowpass', freq: 620 - i * 60, gain: 0.07 });
      play([{ f: 300 - i * 18, at, dur: 0.09, type: 'wood', gain: 0.07 }]);
    });
    haptic([10, 90, 10, 90, 10]);
  },
  /** A small pebble click for light taps, toggles and painting. */
  tick() {
    noise({ dur: 0.02, filter: 'bandpass', freq: 3800, q: 3, gain: 0.04 });
    play([{ f: 2600, dur: 0.04, type: 'wood', gain: 0.03 }]);
  },
  /** Starting a workout: a bright rising bell pair. */
  start() {
    play([
      { f: G6, dur: 0.4, type: 'bell', gain: 0.045 },
      { f: C7, at: 0.08, dur: 0.6, type: 'bell', gain: 0.045 }
    ]);
    haptic(12);
  },
  /** A wooden knock for buttons. */
  tap() {
    play([{ f: 420, dur: 0.07, type: 'wood', gain: 0.09, slideTo: 380 }]);
    noise({ dur: 0.03, filter: 'bandpass', freq: 1800, q: 2, gain: 0.035 });
    haptic(10);
  },
  /** Workout complete: a warm rising bell arpeggio. */
  success() {
    play([
      { f: C6, dur: 0.5, type: 'bell', gain: 0.05 },
      { f: E6, at: 0.09, dur: 0.5, type: 'bell', gain: 0.05 },
      { f: G6, at: 0.18, dur: 0.55, type: 'bell', gain: 0.05 },
      { f: C7, at: 0.28, dur: 0.9, type: 'bell', gain: 0.05 }
    ]);
    haptic([12, 40, 18]);
  },
  /** Coins: a bright two-bell jingle with a shimmer. */
  coin() {
    play([
      { f: 1975.5, dur: 0.18, type: 'bell', gain: 0.04 },
      { f: 2637, at: 0.07, dur: 0.45, type: 'bell', gain: 0.04 }
    ]);
    noise({ at: 0.06, dur: 0.18, filter: 'highpass', freq: 7000, gain: 0.012 });
  },
  /** A personal record or a new trophy: a cascade of little bells. */
  record() {
    [C7, E7, G6 * 2, E7, C7 * 1.5].forEach((f, i) => play([{ f, at: i * 0.06, dur: 0.35, type: 'bell', gain: 0.026 }]));
    noise({ dur: 0.4, filter: 'highpass', freq: 6000, gain: 0.01 });
    haptic(16);
  },
  /** Placing something in the base: a hammer thud and a little puff of dust. */
  place() {
    noise({ dur: 0.12, filter: 'lowpass', freq: 520, gain: 0.08 });
    play([{ f: 180, dur: 0.12, type: 'wood', gain: 0.08, slideTo: 120 }]);
    noise({ at: 0.04, dur: 0.3, filter: 'bandpass', freq: 1400, freqTo: 600, q: 0.7, gain: 0.025 });
    haptic(8);
  },
  /** A build finished: sparkling bells rising over a soft chord. */
  built() {
    play([
      { f: C6, dur: 1.1, type: 'bell', gain: 0.03 },
      { f: G6, at: 0.05, dur: 1.0, type: 'bell', gain: 0.025 }
    ]);
    [E7, G6 * 2, C7 * 1.5, E7 * 1.26].forEach((f, i) => play([{ f, at: 0.12 + i * 0.07, dur: 0.4, type: 'bell', gain: 0.022 }]));
    noise({ at: 0.1, dur: 0.6, filter: 'highpass', freq: 6500, gain: 0.012 });
    haptic([10, 40, 10]);
  },
  /** Base level up: a proper little fanfare with a sparkle on top. */
  levelUp() {
    play([
      { f: G5, dur: 0.22, type: 'triangle', gain: 0.045 },
      { f: C6, at: 0.12, dur: 0.22, type: 'triangle', gain: 0.045 },
      { f: E6, at: 0.24, dur: 0.22, type: 'triangle', gain: 0.045 },
      { f: G6, at: 0.36, dur: 0.3, type: 'triangle', gain: 0.045 },
      { f: C7, at: 0.5, dur: 1.1, type: 'bell', gain: 0.05 },
      { f: E7, at: 0.58, dur: 0.9, type: 'bell', gain: 0.025 }
    ]);
    noise({ at: 0.5, dur: 0.7, filter: 'highpass', freq: 6000, gain: 0.014 });
    haptic([15, 50, 15, 50, 30]);
  },
  /** Rest day: a calm, low, bell-like chord. */
  rest() {
    play([
      { f: C5, dur: 1.2, type: 'bell', gain: 0.035 },
      { f: E5, at: 0.14, dur: 1.2, type: 'bell', gain: 0.03 },
      { f: G5, at: 0.28, dur: 1.3, type: 'bell', gain: 0.028 }
    ]);
  },
  /** Something can't be done: a soft, low wooden "bonk", never harsh. */
  error() {
    play([
      { f: 330, dur: 0.1, type: 'wood', gain: 0.05 },
      { f: 247, at: 0.1, dur: 0.16, type: 'wood', gain: 0.05, slideTo: 220 }
    ]);
    haptic(20);
  },
  /** A soft confirm for purchases and saves. */
  confirm() {
    play([
      { f: E6, dur: 0.3, type: 'bell', gain: 0.04 },
      { f: A6, at: 0.07, dur: 0.45, type: 'bell', gain: 0.04 }
    ]);
    haptic(10);
  },
  /** Screens sliding: a soft breath of air. */
  whoosh() {
    noise({ dur: 0.22, filter: 'bandpass', freq: 500, freqTo: 1800, q: 0.8, gain: 0.06 });
  }
};
