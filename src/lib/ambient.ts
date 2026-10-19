import { useCallback, useState } from 'react';
import { audioOut, isSoundOn } from './feedback';

/**
 * A quiet ambient soundscape for the Base: a breeze, birdsong, and (when the
 * base has them) babbling water and a crackling campfire. All synthesized,
 * faded in and out softly, paused when the app is in the background.
 */

const AMBIENT_KEY = '2failure-ambient-on';
/** The soundscape sits well under the effects (about -9 dB). */
const AMBIENT_LEVEL = 0.36;

export function isAmbientOn(): boolean {
  try {
    return window.localStorage.getItem(AMBIENT_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function useAmbientSetting() {
  const [on, setOn] = useState(isAmbientOn);
  const toggle = useCallback(() => {
    setOn((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(AMBIENT_KEY, next ? 'on' : 'off');
      } catch {
        // Ignore storage failures.
      }
      return next;
    });
  }, []);
  return { ambientOn: on, toggleAmbient: toggle };
}

type Running = {
  bus: GainNode;
  stops: Array<() => void>;
  timers: number[];
};
let running: Running | null = null;

function noiseLoop(ctx: BaseAudioContext, seconds: number, brown = false): AudioBufferSourceNode {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = white;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

function lfo(ctx: BaseAudioContext, rate: number, depth: number, target: AudioParam) {
  const osc = ctx.createOscillator();
  osc.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.value = depth;
  osc.connect(g);
  g.connect(target);
  osc.start();
  return () => osc.stop();
}

/** One bird: two to four quick whistled notes that glide. */
function chirp(ctx: BaseAudioContext, out: AudioNode, at = 0) {
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.6 - 0.8;
  pan.connect(out);
  const base = 2300 + Math.random() * 1500;
  const notes = 2 + Math.floor(Math.random() * 3);
  let t = ctx.currentTime + 0.02 + at;
  for (let i = 0; i < notes; i++) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    env.gain.value = 0;
    const dur = 0.05 + Math.random() * 0.07;
    const up = Math.random() > 0.5;
    osc.frequency.setValueAtTime(base * (up ? 0.85 : 1.15), t);
    osc.frequency.exponentialRampToValueAtTime(base * (up ? 1.2 : 0.8), t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.022, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env);
    env.connect(pan);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur + 0.03 + Math.random() * 0.05;
  }
}

/** One crackle or pop from a fire. */
function crackle(ctx: BaseAudioContext, out: AudioNode, at = 0) {
  const len = Math.floor(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1500 + Math.random() * 2500;
  const g = ctx.createGain();
  g.gain.value = 0.02 + Math.random() * 0.04;
  src.connect(hp);
  hp.connect(g);
  g.connect(out);
  src.start(ctx.currentTime + at);
}

export function startAmbient({ water = false, fire = false }: { water?: boolean; fire?: boolean } = {}) {
  stopAmbient(true);
  if (!isSoundOn() || !isAmbientOn()) return;
  const a = audioOut();
  if (!a) return;
  const { ctx } = a;
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, ctx.currentTime);
  bus.gain.exponentialRampToValueAtTime(AMBIENT_LEVEL, ctx.currentTime + 1.5);
  bus.connect(a.out);
  const stops: Array<() => void> = [];
  const timers: number[] = [];

  // Breeze: brown noise through a slowly swaying low-pass filter.
  const wind = noiseLoop(ctx, 4, true);
  const windLp = ctx.createBiquadFilter();
  windLp.type = 'lowpass';
  windLp.frequency.value = 420;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.05;
  wind.connect(windLp);
  windLp.connect(windGain);
  windGain.connect(bus);
  wind.start();
  stops.push(() => wind.stop(), lfo(ctx, 0.07, 220, windLp.frequency), lfo(ctx, 0.11, 0.025, windGain.gain));

  // Water: band-passed noise with a babbling wobble.
  if (water) {
    const stream = noiseLoop(ctx, 3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.value = 0.012;
    stream.connect(bp);
    bp.connect(g);
    g.connect(bus);
    stream.start();
    stops.push(() => stream.stop(), lfo(ctx, 3.1, 260, bp.frequency), lfo(ctx, 0.9, 0.006, g.gain));
  }

  // Birdsong every few seconds; fire crackles every fraction of a second.
  const birds = () => {
    chirp(ctx, bus);
    timers.push(window.setTimeout(birds, 2500 + Math.random() * 5500));
  };
  timers.push(window.setTimeout(birds, 1200));
  if (fire) {
    const pop = () => {
      crackle(ctx, bus);
      timers.push(window.setTimeout(pop, 90 + Math.random() * 420));
    };
    timers.push(window.setTimeout(pop, 300));
  }
  running = { bus, stops, timers };
}

export function stopAmbient(immediate = false) {
  const r = running;
  if (!r) return;
  running = null;
  for (const t of r.timers) window.clearTimeout(t);
  const a = audioOut();
  const finish = () => {
    for (const stop of r.stops) {
      try {
        stop();
      } catch {
        // Already stopped.
      }
    }
    r.bus.disconnect();
  };
  if (immediate || !a) return finish();
  r.bus.gain.cancelScheduledValues(a.ctx.currentTime);
  r.bus.gain.setValueAtTime(r.bus.gain.value || 0.0001, a.ctx.currentTime);
  r.bus.gain.exponentialRampToValueAtTime(0.0001, a.ctx.currentTime + 0.8);
  window.setTimeout(finish, 900);
}

/**
 * Renders the soundscape offline (deterministic timing) for previews and
 * level checks. Uses the same layers as the live version.
 */
export async function renderAmbientOffline(seconds: number, { water = false, fire = false } = {}): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  const comp = ctx.createDynamicsCompressor();
  comp.connect(ctx.destination);
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, 0);
  bus.gain.exponentialRampToValueAtTime(AMBIENT_LEVEL, 1.5);
  bus.connect(comp);
  const wind = noiseLoop(ctx, 4, true);
  const windLp = ctx.createBiquadFilter();
  windLp.type = 'lowpass';
  windLp.frequency.value = 420;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.05;
  wind.connect(windLp);
  windLp.connect(windGain);
  windGain.connect(bus);
  wind.start();
  lfo(ctx, 0.07, 220, windLp.frequency);
  lfo(ctx, 0.11, 0.025, windGain.gain);
  if (water) {
    const stream = noiseLoop(ctx, 3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.value = 0.012;
    stream.connect(bp);
    bp.connect(g);
    g.connect(bus);
    stream.start();
    lfo(ctx, 3.1, 260, bp.frequency);
    lfo(ctx, 0.9, 0.006, g.gain);
  }
  for (let t = 1.2; t < seconds - 0.5; t += 2.5 + Math.random() * 3) chirp(ctx, bus, t);
  if (fire) for (let t = 0.3; t < seconds; t += 0.09 + Math.random() * 0.42) crackle(ctx, bus, t);
  return ctx.startRendering();
}
