import { useMemo } from 'react';
import { P } from './IsoArt';
import { buildableBounds } from '../../game/catalog';
import { occupancy, type GameState } from '../../game/engine';

/**
 * Little life on the island: animals that wander back and forth, ducks on
 * ponds and butterflies over flowers. Barns and coops bring more animals.
 * Uses SVG motion (no state updates), and stays still for reduced motion.
 */

type Kind = 'cow' | 'sheep' | 'chicken' | 'bunny' | 'duck' | 'pig' | 'dog' | 'cat' | 'fox' | 'villager1' | 'villager2' | 'villager3' | 'villager4';

/** Small seeded random generator, so animals stay put while you're on the screen. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * Animal art, facing right, centred on its feet. Legs are split into two
 * alternating pairs (leg-a / leg-b) that swing while walking; the head is its
 * own group for idle actions (pecking, grazing, looking around).
 */

function Leg({ x, y, h, w = 3, color, pair }: { x: number; y: number; h: number; w?: number; color: string; pair: 'a' | 'b' }) {
  return <rect x={x - w / 2} y={y} width={w} height={h} rx={w / 2.5} fill={color} className={`critter-leg leg-${pair}`} />;
}

function Cow() {
  return (
    <g>
      <ellipse cx={0} cy={14} rx={18} ry={4} fill="#000" opacity={0.25} />
      <Leg x={-10} y={3} h={10} color="#3a3a3a" pair="b" />
      <Leg x={6} y={3} h={10} color="#3a3a3a" pair="b" />
      <g className="critter-body">
        <Leg x={-4} y={3} h={10} color="#2a2a2a" pair="a" />
        <Leg x={11} y={3} h={10} color="#2a2a2a" pair="a" />
        <ellipse cx={0} cy={0} rx={15} ry={9} fill="#f4f4f0" />
        <ellipse cx={0} cy={0} rx={15} ry={9} fill="url(#hf-body)" />
        <ellipse cx={-5} cy={-3} rx={5} ry={4} fill="#2a2a2a" />
        <ellipse cx={6} cy={3} rx={4} ry={3} fill="#2a2a2a" />
        <ellipse cx={-1} cy={7} rx={3} ry={1.6} fill="#f5a3b5" />
        <path d="M-15 -2 q-5 2 -4 9" stroke="#f4f4f0" strokeWidth={2} fill="none" strokeLinecap="round" />
        <g className="critter-head critter-head--graze">
          <ellipse cx={15} cy={-6} rx={7} ry={6} fill="#f4f4f0" />
          <ellipse cx={15} cy={-6} rx={7} ry={6} fill="url(#hf-body)" />
          <ellipse cx={19} cy={-4} rx={4} ry={3} fill="#f5a3b5" />
          <circle cx={14} cy={-8} r={1.3} fill="#1a1a1a" />
          <path d="M11 -11 l-2 -4 M17 -12 l2 -4" stroke="#d8c8a0" strokeWidth={2} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function Sheep() {
  return (
    <g>
      <ellipse cx={0} cy={13} rx={16} ry={4} fill="#000" opacity={0.25} />
      <Leg x={-8} y={4} h={8} w={2.6} color="#3a3a3a" pair="b" />
      <Leg x={4} y={4} h={8} w={2.6} color="#3a3a3a" pair="b" />
      <g className="critter-body">
        <Leg x={-3} y={4} h={8} w={2.6} color="#2a2a2a" pair="a" />
        <Leg x={9} y={4} h={8} w={2.6} color="#2a2a2a" pair="a" />
        {[
          [-8, -1],
          [-2, -4],
          [5, -2],
          [0, 3],
          [-6, 4],
          [7, 3]
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={6} fill="#f7f2e6" />
        ))}
        <ellipse cx={0} cy={0} rx={13} ry={9} fill="url(#hf-body)" />
        <g className="critter-head critter-head--graze">
          <ellipse cx={13} cy={-4} rx={5} ry={6} fill="#2a2a2a" />
          <circle cx={14} cy={-6} r={1.1} fill="#ffffff" />
          <ellipse cx={10} cy={-8} rx={2.5} ry={1.4} fill="#2a2a2a" transform="rotate(-30 10 -8)" />
        </g>
      </g>
    </g>
  );
}

function Chicken() {
  return (
    <g>
      <ellipse cx={0} cy={9.5} rx={9} ry={2.6} fill="#000" opacity={0.28} />
      <g stroke="#e8902a" strokeWidth={1.5} strokeLinecap="round" fill="none">
        <path d="M-2 4.5 v4.2 M-2 8.7 l-1.8 0.6 M-2 8.7 l1.6 0.6" className="critter-leg leg-a" />
        <path d="M2.5 4.5 v4.2 M2.5 8.7 l-1.6 0.6 M2.5 8.7 l1.8 0.6" className="critter-leg leg-b" />
      </g>
      <g className="critter-body">
        <path d="M-6.5 -1 q-5 -5 -3 -9 q1.5 3 3.5 3.2 q-1 -3.5 1 -5.5 q0.8 3.6 2.6 5.2 Z" fill="#f2f0ea" />
        <path d="M-6.5 -1 q-4 -4 -2.6 -7.4 q1.4 2.6 3 3 Z" fill="#d9d4c8" />
        <ellipse cx={0} cy={0} rx={7.5} ry={6.2} fill="#fbfaf6" />
        <ellipse cx={0} cy={0} rx={7.5} ry={6.2} fill="url(#hf-body)" />
        <path d="M-4 -1.5 q4 -2.5 7.5 0.5 q-1.2 4.2 -5.2 4 q-2.6 -0.6 -2.3 -4.5 Z" fill="#e6e2d8" />
        <path d="M-2.5 0.8 q2.4 0.9 4.6 0 M-2 2.4 q2 0.7 3.8 0" stroke="#c9c3b5" strokeWidth={0.7} fill="none" />
        <g className="critter-head critter-head--peck">
          <circle cx={5.4} cy={-5.2} r={3.7} fill="#fbfaf6" />
          <circle cx={5.4} cy={-5.2} r={3.7} fill="url(#hf-body)" />
          <path d="M3.6 -8.4 q0.8 -2.4 1.8 -0.5 q0.9 -2.4 1.9 -0.4 q1.2 -1.6 1.4 0.4 Z" fill="#e5484d" />
          <path d="M8.6 -4.2 q1.1 1.8 -0.4 2.8 q-0.9 -1 0.4 -2.8 Z" fill="#e5484d" />
          <polygon points="8.7,-5.8 11.8,-4.9 8.7,-3.9" fill="#f2a541" />
          <polygon points="8.7,-4.9 11.8,-4.9 8.7,-3.9" fill="#c97a1e" />
          <circle cx={6.4} cy={-6} r={0.95} fill="#1a1a1a" />
          <circle cx={6.7} cy={-6.3} r={0.3} fill="#fff" />
        </g>
      </g>
    </g>
  );
}

function Bunny() {
  return (
    <g>
      <ellipse cx={0} cy={9} rx={9} ry={2.5} fill="#000" opacity={0.25} className="critter-hop-shadow" />
      <g className="critter-hop">
        <ellipse cx={-1} cy={2} rx={8} ry={6} fill="#c9b8a6" />
        <ellipse cx={-1} cy={2} rx={8} ry={6} fill="url(#hf-body)" />
        <ellipse cx={-4} cy={7} rx={4} ry={2} fill="#b5a390" />
        <circle cx={-8} cy={1} r={2.5} fill="#ffffff" />
        <g className="critter-head critter-head--look">
          <circle cx={6} cy={-2} r={4.5} fill="#c9b8a6" />
          <ellipse cx={5} cy={-10} rx={1.6} ry={5} fill="#c9b8a6" />
          <ellipse cx={8} cy={-10} rx={1.6} ry={5} fill="#c9b8a6" />
          <ellipse cx={8} cy={-10} rx={0.7} ry={3.5} fill="#f5a3b5" />
          <circle cx={8} cy={-3} r={0.9} fill="#1a1a1a" />
          <circle cx={10.3} cy={-1.4} r={0.7} fill="#f5a3b5" />
        </g>
      </g>
    </g>
  );
}

function Duck() {
  return (
    <g>
      <ellipse cx={0} cy={6} rx={12} ry={3} fill="#7fd3f5" opacity={0.5} />
      <g className="critter-paddle">
        <ellipse cx={0} cy={2} rx={9} ry={5} fill="#f6df8a" />
        <ellipse cx={0} cy={2} rx={9} ry={5} fill="url(#hf-body)" />
        <path d="M-9 1 q-3 -4 0 -5" fill="#f6df8a" />
        <path d="M-4 0 q3 -2 6 0 q-1 3 -6 0 Z" fill="#e8cc6a" />
        <circle cx={6} cy={-3} r={4} fill="#f6df8a" />
        <polygon points="9.5,-3 13,-2 9.5,-1" fill="#f2a541" />
        <circle cx={7} cy={-4} r={0.9} fill="#1a1a1a" />
      </g>
    </g>
  );
}

function Pig() {
  return (
    <g>
      <ellipse cx={0} cy={12} rx={15} ry={4} fill="#000" opacity={0.25} />
      <Leg x={-9} y={3} h={8} w={3.2} color="#d97f96" pair="b" />
      <Leg x={4} y={3} h={8} w={3.2} color="#d97f96" pair="b" />
      <g className="critter-body">
        <Leg x={-3} y={3} h={8} w={3.2} color="#e88fa6" pair="a" />
        <Leg x={9} y={3} h={8} w={3.2} color="#e88fa6" pair="a" />
        <ellipse cx={0} cy={0} rx={14} ry={9} fill="#f6aec0" />
        <ellipse cx={0} cy={0} rx={14} ry={9} fill="url(#hf-body)" />
        <ellipse cx={-4} cy={-3} rx={6} ry={3} fill="#fbc8d5" opacity={0.8} />
        <path d="M-14 -2 q-4 -2 -3 3 q1 3 3 0" stroke="#e88fa6" strokeWidth={1.6} fill="none" />
        <g className="critter-head critter-head--graze">
          <circle cx={13} cy={-3} r={6} fill="#f6aec0" />
          <ellipse cx={18} cy={-2} rx={3} ry={2.5} fill="#e88fa6" />
          <circle cx={17.5} cy={-2.5} r={0.6} fill="#9c4a5e" />
          <circle cx={18.8} cy={-2.5} r={0.6} fill="#9c4a5e" />
          <circle cx={13} cy={-5} r={1} fill="#1a1a1a" />
          <path d="M10 -8 l-1 -4 l4 2 Z" fill="#e88fa6" />
        </g>
      </g>
    </g>
  );
}

function Dog() {
  return (
    <g>
      <ellipse cx={0} cy={11} rx={13} ry={3.5} fill="#000" opacity={0.25} />
      <Leg x={-8} y={2} h={8} w={2.8} color="#8a5a2a" pair="b" />
      <Leg x={4} y={2} h={8} w={2.8} color="#8a5a2a" pair="b" />
      <g className="critter-body">
        <Leg x={-3} y={2} h={8} w={2.8} color="#9a6a3a" pair="a" />
        <Leg x={8} y={2} h={8} w={2.8} color="#9a6a3a" pair="a" />
        <ellipse cx={0} cy={0} rx={11} ry={6.5} fill="#c48a52" />
        <ellipse cx={0} cy={0} rx={11} ry={6.5} fill="url(#hf-body)" />
        <path d="M-11 -2 q-6 -6 -4 -10" stroke="#c48a52" strokeWidth={3} fill="none" strokeLinecap="round" className="critter-tail" />
        <g className="critter-head critter-head--look">
          <circle cx={11} cy={-5} r={5.5} fill="#c48a52" />
          <ellipse cx={16} cy={-4} rx={3.2} ry={2.4} fill="#e8c49a" />
          <circle cx={18.5} cy={-4.5} r={1.1} fill="#1a1a1a" />
          <ellipse cx={8.5} cy={-8} rx={2.2} ry={4} fill="#7a4a24" transform="rotate(-15 8.5 -8)" />
          <circle cx={12} cy={-6} r={1} fill="#1a1a1a" />
        </g>
      </g>
    </g>
  );
}

function Cat() {
  return (
    <g>
      <ellipse cx={0} cy={10} rx={11} ry={3} fill="#000" opacity={0.25} />
      <Leg x={-6} y={2} h={7} w={2.2} color="#6d6f7c" pair="b" />
      <Leg x={3} y={2} h={7} w={2.2} color="#6d6f7c" pair="b" />
      <g className="critter-body">
        <Leg x={-2} y={2} h={7} w={2.2} color="#7d7f8c" pair="a" />
        <Leg x={7} y={2} h={7} w={2.2} color="#7d7f8c" pair="a" />
        <ellipse cx={0} cy={0} rx={9} ry={5.5} fill="#9a9caa" />
        <ellipse cx={0} cy={0} rx={9} ry={5.5} fill="url(#hf-body)" />
        <path d="M-9 -1 q-6 -2 -5 -10" stroke="#9a9caa" strokeWidth={2.6} fill="none" strokeLinecap="round" className="critter-tail" />
        <path d="M-3 -4 l2 3 M1 -5 l1 3" stroke="#7d7f8c" strokeWidth={1.2} />
        <g className="critter-head critter-head--look">
          <circle cx={9} cy={-5} r={4.8} fill="#9a9caa" />
          <polygon points="6,-8.5 6.5,-13 9,-9.5" fill="#9a9caa" />
          <polygon points="10,-9.5 12,-13 12.5,-8.5" fill="#9a9caa" />
          <circle cx={8} cy={-5.5} r={0.9} fill="#2a8a3a" />
          <circle cx={11} cy={-5.5} r={0.9} fill="#2a8a3a" />
        </g>
      </g>
    </g>
  );
}

function Fox() {
  return (
    <g>
      <ellipse cx={0} cy={10} rx={13} ry={3.2} fill="#000" opacity={0.25} />
      <Leg x={-6} y={2} h={7} w={2.4} color="#2a1e18" pair="b" />
      <Leg x={4} y={2} h={7} w={2.4} color="#2a1e18" pair="b" />
      <g className="critter-body">
        <Leg x={-2} y={2} h={7} w={2.4} color="#3a2a22" pair="a" />
        <Leg x={8} y={2} h={7} w={2.4} color="#3a2a22" pair="a" />
        <ellipse cx={0} cy={0} rx={10} ry={5.5} fill="#e5793a" />
        <ellipse cx={0} cy={0} rx={10} ry={5.5} fill="url(#hf-body)" />
        <g className="critter-tail">
          <path d="M-9 0 q-10 -2 -12 -9 q6 2 12 5 Z" fill="#e5793a" />
          <path d="M-19 -7 q-2 -2 -2 -2 q2 1 4 3 Z" fill="#ffffff" />
        </g>
        <path d="M6 -2 l12 -1 l-5 6 Z" fill="#ffffff" />
        <g className="critter-head critter-head--look">
          <circle cx={9} cy={-4} r={4.5} fill="#e5793a" />
          <polygon points="6.5,-7.5 7,-12.5 9.5,-8.5" fill="#e5793a" />
          <polygon points="10,-8.5 12.5,-12.5 12.5,-7" fill="#e5793a" />
          <polygon points="12.5,-4 17,-2.5 12.5,-1" fill="#ffffff" />
          <circle cx={17} cy={-2.7} r={0.9} fill="#1a1a1a" />
          <circle cx={10} cy={-5} r={0.9} fill="#1a1a1a" />
        </g>
      </g>
    </g>
  );
}

/**
 * Villagers: little townsfolk in the same chunky style as the animals. They
 * walk with the same leg swing and look around when they stop.
 */
function Villager({ shirt, pants, skin, hair, carry }: { shirt: string; pants: string; skin: string; hair: string; carry?: 'basket' | 'wood' }) {
  return (
    <g>
      <ellipse cx={0} cy={11} rx={6.5} ry={2} fill="#000" opacity={0.25} />
      <Leg x={-1.8} y={2} h={8.5} w={2.6} color={pants} pair="b" />
      <g className="critter-body">
        <Leg x={1.8} y={2} h={8.5} w={2.6} color={pants} pair="a" />
        <rect x={-4.6} y={-9.5} width={9.2} height={12.5} rx={3.6} fill={shirt} />
        <rect x={-4.6} y={-9.5} width={9.2} height={12.5} rx={3.6} fill="url(#hf-body)" />
        <rect x={-4.6} y={0.6} width={9.2} height={1.6} fill="#000" opacity={0.18} />
        {carry === 'basket' && (
          <g>
            <path d="M3 -3 Q 7.5 -9 12 -3" stroke="#7a4a20" strokeWidth={1} fill="none" />
            <path d="M2.6 -3 H12.4 L11.4 2 H3.6 Z" fill="#c08a4a" stroke="#7a4a20" strokeWidth={0.7} />
            <circle cx={5.6} cy={-3.6} r={1.5} fill="#e5484d" />
            <circle cx={8.6} cy={-3.8} r={1.5} fill="#f2a541" />
          </g>
        )}
        {carry === 'wood' && (
          <g>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={1.4} y={-6.4 + i * 2.6} width={9.6} height={2.4} rx={1.2} fill="#a0703c" stroke="#5a3a1c" strokeWidth={0.6} />
            ))}
          </g>
        )}
        <rect x={0.8} y={-7.6} width={2.8} height={carry ? 5.6 : 8.6} rx={1.4} fill={shirt} stroke="#000" strokeOpacity={0.15} strokeWidth={0.5} />
        <g className="critter-head critter-head--look">
          <circle cx={0.6} cy={-13.6} r={4.4} fill={skin} />
          <path d="M-3.8 -13.8 Q -3.6 -18.8 0.8 -18.4 Q 5 -18.2 5 -14.4 Q 2.4 -16.2 -0.4 -15.6 Q -2.6 -15 -3.8 -13.8 Z" fill={hair} />
          <circle cx={3} cy={-13.6} r={0.75} fill="#1a1a1a" />
          <circle cx={3.6} cy={-11.8} r={0.9} fill="#ff8a8a" opacity={0.5} />
        </g>
      </g>
    </g>
  );
}

type Look = { shirt: string; pants: string; skin: string; hair: string };
const LOOKS: Look[] = [
  { shirt: '#e5484d', pants: '#3b3f58', skin: '#f1c27d', hair: '#5a3825' },
  { shirt: '#3b82f6', pants: '#4b3a2a', skin: '#c68642', hair: '#1f1a17' },
  { shirt: '#f2a541', pants: '#3f4a3a', skin: '#8d5524', hair: '#141010' },
  { shirt: '#8b5cf6', pants: '#2f3542', skin: '#ffdbac', hair: '#c58b3a' }
];
type Pose = 'hang' | 'dip' | 'punch' | 'jump' | 'sit';

/** A villager mid-exercise (or sitting by the fire). Feet at y ≈ 11, hands where the pose needs them. */
function Athlete({ look, pose }: { look: Look; pose: Pose }) {
  const { shirt, pants, skin, hair } = look;
  const arm = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={shirt} strokeWidth={2.6} strokeLinecap="round" />
  );
  const leg = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={pants} strokeWidth={2.6} strokeLinecap="round" />
  );
  const hand = (x: number, y: number) => <circle cx={x} cy={y} r={1.4} fill={skin} />;
  const head = (
    <g>
      <circle cx={0.6} cy={-13.6} r={4.4} fill={skin} />
      <path d="M-3.8 -13.8 Q -3.6 -18.8 0.8 -18.4 Q 5 -18.2 5 -14.4 Q 2.4 -16.2 -0.4 -15.6 Q -2.6 -15 -3.8 -13.8 Z" fill={hair} />
      <circle cx={3} cy={-13.6} r={0.75} fill="#1a1a1a" />
    </g>
  );
  const torso = (
    <g>
      <rect x={-4.6} y={-9.5} width={9.2} height={12.5} rx={3.6} fill={shirt} />
      <rect x={-4.6} y={-9.5} width={9.2} height={12.5} rx={3.6} fill="url(#hf-body)" />
    </g>
  );
  if (pose === 'sit') {
    return (
      <g>
        <rect x={-7} y={6} width={14} height={4.5} rx={2.2} fill="#8a5a2b" stroke="#5a3a1c" strokeWidth={0.6} />
        {leg(-1, 4, 6, 4.5)}
        {leg(6, 4.5, 6.5, 10)}
        <g transform="translate(0 6)">
          {torso}
          {arm(1.5, -6, 5.5, -1)}
          {head}
        </g>
      </g>
    );
  }
  const legs =
    pose === 'jump' ? (
      <g>
        {leg(-1.6, 2.5, -3, 7)}
        {leg(-3, 7, -1.4, 10.5)}
        {leg(1.8, 2.5, 3.4, 7)}
        {leg(3.4, 7, 2, 10.5)}
      </g>
    ) : (
      <g>
        {leg(-1.6, 2.5, -1.8, 10.5)}
        {leg(1.8, 2.5, pose === 'punch' ? 4.5 : 1.8, 10.5)}
      </g>
    );
  return (
    <g>
      {pose !== 'hang' && pose !== 'dip' && <ellipse cx={0} cy={11} rx={6.5} ry={2} fill="#000" opacity={0.25} />}
      {legs}
      {torso}
      {pose === 'hang' && (
        <>
          {arm(-3.6, -8, -5, -23)}
          {arm(3.6, -8, 5, -23)}
          {hand(-5, -23.5)}
          {hand(5, -23.5)}
        </>
      )}
      {pose === 'dip' && (
        <>
          {arm(-4, -8, -7, 0)}
          {arm(4, -8, 7, 0)}
          {hand(-7, 0.5)}
          {hand(7, 0.5)}
        </>
      )}
      {pose === 'punch' && (
        <>
          {arm(-2, -7, 2, -3)}
          <g className="ex-punch">
            {arm(2, -7, 12, -7)}
            {hand(12.5, -7)}
          </g>
        </>
      )}
      {pose === 'jump' && (
        <>
          {arm(-3.6, -8, -7, -12)}
          {arm(3.6, -8, 7, -12)}
        </>
      )}
      {head}
    </g>
  );
}

function Bee() {
  return (
    <g>
      <ellipse cx={0} cy={-2} rx={2.2} ry={1.4} fill="#ffffff" opacity={0.85} className="base-bee-wing" />
      <ellipse cx={0} cy={0} rx={2.6} ry={1.8} fill="#f7c948" />
      <rect x={-0.6} y={-1.8} width={0.9} height={3.6} fill="#2a2a2a" />
      <rect x={1.1} y={-1.6} width={0.8} height={3.2} fill="#2a2a2a" />
    </g>
  );
}

const ART: Record<Kind, () => JSX.Element> = {
  villager1: () => <Villager shirt="#e5484d" pants="#3b3f58" skin="#f1c27d" hair="#5a3825" carry="basket" />,
  villager2: () => <Villager shirt="#3b82f6" pants="#4b3a2a" skin="#c68642" hair="#1f1a17" />,
  villager3: () => <Villager shirt="#f2a541" pants="#3f4a3a" skin="#8d5524" hair="#141010" carry="wood" />,
  villager4: () => <Villager shirt="#8b5cf6" pants="#2f3542" skin="#ffdbac" hair="#c58b3a" />,
  cow: Cow,
  sheep: Sheep,
  chicken: Chicken,
  bunny: Bunny,
  duck: Duck,
  pig: Pig,
  dog: Dog,
  cat: Cat,
  fox: Fox
};
/** Walking speed in board units per second. */
const SPEED: Record<Kind, number> = { cow: 16, sheep: 18, pig: 20, chicken: 34, bunny: 42, duck: 22, dog: 40, cat: 30, fox: 36, villager1: 22, villager2: 24, villager3: 20, villager4: 23 };
/** Animals are drawn a bit larger than life so they read as cute on phones. */
const CRITTER_SCALE = 1.45;

type Point = [number, number];
type Route = {
  kind: Kind;
  path: string;
  keyPoints: string;
  keyTimes: string;
  flipValues: string;
  flipTimes: string;
  /** Walking/idle switches, in step with the motion (pause, then walk, per stop). */
  stateValues: string;
  stateTimes: string;
  dur: number;
  delay: number;
  start: Point;
};

/**
 * A wandering route through random waypoints, looping back to the start,
 * with a pause at each stop. Facing flips when walking left.
 */
function buildRoute(kind: Kind, points: Point[], rnd: () => number, pauseScale = 1): Route {
  const loop = [...points, points[0]];
  const lengths = loop.slice(1).map((p, i) => Math.hypot(p[0] - loop[i][0], p[1] - loop[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const pauses = points.map(() => (0.8 + rnd() * 2.2) * pauseScale);
  const dur = total / SPEED[kind] + pauses.reduce((a, b) => a + b, 0);
  const times: number[] = [0];
  const keys: number[] = [0];
  const flipTimes: number[] = [];
  const flipValues: string[] = [];
  let t = 0;
  let along = 0;
  lengths.forEach((len, i) => {
    flipTimes.push(t / dur);
    const dx = loop[i + 1][0] - loop[i][0];
    flipValues.push(dx < 0 ? '-1 1' : '1 1');
    t += pauses[i];
    times.push(t / dur);
    keys.push(along / total);
    t += len / SPEED[kind];
    along += len;
    times.push(t / dur);
    keys.push(along / total);
  });
  times[times.length - 1] = 1;
  keys[keys.length - 1] = 1;
  const fmt = (n: number) => Math.min(1, Math.max(0, n)).toFixed(4);
  // times = [start, walk₀, stop₀, walk₁, stop₁, …]: pause until each walk time.
  const stateTimes = times.slice(0, -1);
  const base = `critter critter--${kind}`;
  const stateValues = stateTimes.map((_, i) => `${base} ${i % 2 === 0 ? 'idle' : 'walk'}`);
  return {
    stateValues: stateValues.join(';'),
    stateTimes: stateTimes.map(fmt).join(';'),
    kind,
    path: `M${loop.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}`,
    keyPoints: keys.map(fmt).join(';'),
    keyTimes: times.map(fmt).join(';'),
    flipValues: flipValues.join(';'),
    flipTimes: flipTimes.map(fmt).join(';'),
    dur,
    delay: rnd() * dur,
    start: points[0]
  };
}

type Project = (p: [number, number]) => [number, number];

function planRoutes(state: GameState, seed: number, project: Project, wanderingVillagers = 4): Route[] {
  const rnd = mulberry32(seed);
  const { min, max } = buildableBounds(state.landLevel);
  const occupied = occupancy(state);
  const isWater = (x: number, y: number) => state.terrain?.[`${x},${y}`] === 'water';
  const count = (id: string) => state.placed.filter((p) => p.itemId === id && p.level > 0).length;

  const land: Point[] = [];
  const water: Point[] = [];
  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      // A random spot inside the tile, so animals don't line up on a grid.
      const point: Point = [x * 100 + 25 + rnd() * 50, y * 100 + 45 + rnd() * 40];
      (isWater(x, y) ? water : land).push(point);
    }
  }
  const pick = (pool: Point[]) => pool[Math.floor(rnd() * pool.length)];

  const kinds: Kind[] = ['cow', 'chicken', 'bunny'];
  const wild: Kind[] = ['bunny', 'cat', 'dog', 'fox', 'chicken'];
  const extras = Math.min(6, 2 + state.landLevel);
  for (let i = 0; i < extras; i++) kinds.push(wild[Math.floor(rnd() * wild.length)]);
  for (let i = 0; i < Math.min(3, count('barn')); i++) kinds.push('cow', 'sheep', 'pig');
  for (let i = 0; i < Math.min(3, count('coop')); i++) kinds.push('chicken', 'chicken');

  const routes: Route[] = [];
  if (land.length >= 2) {
    for (const kind of kinds) {
      const stops = 2 + Math.floor(rnd() * 3);
      const first = pick(land);
      const points: Point[] = [first];
      // Wander locally: each next stop is within a few tiles of the last.
      for (let i = 1; i < stops; i++) {
        const prev = points[i - 1];
        const near = land.filter((p) => Math.abs(p[0] - prev[0]) < 360 && Math.abs(p[1] - prev[1]) < 300);
        points.push(pick(near.length > 1 ? near : land));
      }
      routes.push(buildRoute(kind, points.map(project), rnd));
    }
  }
  // Villagers live near the buildings: one for the HQ, more as the Lodge grows.
  const structures = state.placed.filter((p) => p.level > 0 && ['hq', 'lodge', 'forge', 'watchtower', 'spring', 'yard'].includes(p.itemId));
  const lodgeLevel = state.placed.find((p) => p.itemId === 'lodge')?.level ?? 0;
  const villagers = Math.min(4, 1 + lodgeLevel + (structures.length > 3 ? 1 : 0));
  const nearHome = land.filter((pt) =>
    structures.some((st) => Math.abs(pt[0] - (st.x * 100 + 50)) < 320 && Math.abs(pt[1] - (st.y * 100 + 50)) < 320)
  );
  const villageKinds: Kind[] = ['villager1', 'villager2', 'villager3', 'villager4'];
  // Painted paths: villagers stroll along them (there and back), not across the grass.
  const pathTiles = Object.entries(state.terrain ?? {})
    .filter(([key, t]) => t === 'path' && !occupied.has(key))
    .map(([key]) => key.split(',').map(Number) as Point);
  const onPath = new Set(pathTiles.map(([x, y]) => `${x},${y}`));
  const pathWalk = (): Point[] => {
    let [x, y] = pathTiles[Math.floor(rnd() * pathTiles.length)];
    const walk: Point[] = [[x, y]];
    let prev: Point | null = null;
    for (let step = 0; step < 9; step++) {
      const from: Point | null = prev;
      const next = ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as Point[]).filter(
        ([nx, ny]) => onPath.has(`${nx},${ny}`) && !(from && from[0] === nx && from[1] === ny)
      );
      if (!next.length) break;
      prev = [x, y];
      [x, y] = next[Math.floor(rnd() * next.length)];
      walk.push([x, y]);
    }
    const centres = walk.map(([tx, ty]) => [tx * 100 + 40 + rnd() * 20, ty * 100 + 45 + rnd() * 20] as Point);
    return centres.length > 1 ? [...centres, ...centres.slice(1, -1).reverse()] : centres;
  };
  for (let i = 0; i < Math.min(villagers, wanderingVillagers); i++) {
    if (pathTiles.length >= 3) {
      routes.push(buildRoute(villageKinds[i], pathWalk().map(project), rnd, 0.3));
      continue;
    }
    if (nearHome.length < 2) break;
    const stops = 3 + Math.floor(rnd() * 2);
    const points: Point[] = Array.from({ length: stops }, () => pick(nearHome));
    routes.push(buildRoute(villageKinds[i], points.map(project), rnd));
  }


  const ducks = Math.min(4, Math.ceil(water.length / 4));
  for (let i = 0; i < ducks && water.length; i++) {
    const points: Point[] = [pick(water), pick(water), pick(water)];
    routes.push(buildRoute('duck', points.map(project), rnd));
  }
  // Ducks come to visit lily pads: two paddle slow circles around each pad.
  for (const pad of state.placed.filter((p) => p.itemId === 'lilypad' && p.level > 0)) {
    for (let d = 0; d < 2; d++) {
      const cx = pad.x * 100 + 50;
      const cy = pad.y * 100 + 50;
      const r = 26 + d * 10;
      const ring: Point[] = [0, 1, 2, 3].map((k) => [cx + Math.cos((k + d * 0.5) * (Math.PI / 2)) * r, cy + Math.sin((k + d * 0.5) * (Math.PI / 2)) * r * 0.8]);
      routes.push(buildRoute('duck', ring.map(project), rnd, 0.4));
    }
  }
  return routes;
}

/** Whether it's night on the base (real local time; tests can set window.__baseHour). */
function isNight(): boolean {
  const forced = (window as unknown as { __baseHour?: number }).__baseHour;
  const hour = typeof forced === 'number' ? forced : new Date().getHours();
  return hour >= 19 || hour < 6;
}

type Placed = { x: number; y: number; flip: boolean; pose: Pose; look: Look; cls: string };

/**
 * Life that comes from decorations: by day an athlete on each piece of
 * training equipment; at night villagers gather round the campfire; bees by
 * every beehive.
 */
function planLife(state: GameState, night: boolean, villagers: number) {
  const built = (id: string) => state.placed.filter((p) => p.itemId === id && p.level > 0);
  const athletes: Placed[] = [];
  const sitters: Placed[] = [];
  let glow: [number, number] | null = null;
  const S = CRITTER_SCALE;
  if (!night) {
    let n = 0;
    const add = (pose: Pose, at: [number, number], cls: string, flip = false) => {
      if (athletes.length >= 4) return;
      athletes.push({ x: at[0], y: at[1], flip, pose, look: LOOKS[n++ % LOOKS.length], cls });
    };
    for (const b of built('pullupbar')) {
      const [hx, hy] = P(b.x * 100 + 50, b.y * 100 + 51, 81);
      add('hang', [hx, hy + 23.5 * S], 'ex-pullup');
    }
    for (const b of built('dipbars')) {
      const [hx, hy] = P(b.x * 100 + 50, b.y * 100 + 50, 50);
      add('dip', [hx, hy - 0.5 * S], 'ex-dip');
    }
    for (const b of built('punchbag')) {
      const at = P(b.x * 100 + 38, b.y * 100 + 64, 0);
      const bag = P(b.x * 100 + 62, b.y * 100 + 50, 0);
      add('punch', [at[0], at[1] - 11 * S], 'ex-box', bag[0] < at[0]);
    }
    for (const b of built('plyobox')) {
      // In front of the box (not behind it), so the whole jump is visible.
      const at = P(b.x * 100 + 56, b.y * 100 + 100, 0);
      add('jump', [at[0], at[1] - 11 * S], 'ex-jump');
    }
  } else {
    const fire = built('campfire')[0];
    if (fire) {
      const cx = fire.x * 100 + 50;
      const cy = fire.y * 100 + 50;
      const centre = P(cx, cy, 0);
      glow = centre;
      const seats = [200, 290, 20].slice(0, Math.max(1, Math.min(3, villagers)));
      seats.forEach((deg, i) => {
        const [sx, sy] = P(cx + Math.cos((deg * Math.PI) / 180) * 34, cy + Math.sin((deg * Math.PI) / 180) * 34, 0);
        sitters.push({ x: sx, y: sy - 11 * S, flip: sx > centre[0], pose: 'sit', look: LOOKS[i % LOOKS.length], cls: 'ex-sit' });
      });
    }
  }
  const bees = built('beehive').flatMap((h) =>
    [0, 1, 2, 3].map((i) => {
      const [bx, by] = P(h.x * 100 + 50, h.y * 100 + 50, 44);
      return { x: bx + (i - 1.5) * 6, y: by - (i % 2) * 6, delay: i * 0.9, size: i % 2 ? 12 : 16 };
    })
  );
  return { athletes, sitters, glow, bees };
}

/** Butterflies flutter over flower patches, gardens and meadows. */
function planButterflies(state: GameState, project: Project): Array<{ x: number; y: number; color: string; delay: number }> {
  const spots: Array<[number, number]> = [];
  for (const p of state.placed) if (p.level > 0 && (p.itemId === 'flowers' || p.itemId === 'garden')) spots.push([p.x, p.y]);
  for (const [key, t] of Object.entries(state.terrain ?? {})) {
    if (t === 'meadow') spots.push(key.split(',').map(Number) as [number, number]);
  }
  const colors = ['#ffd1ea', '#fff4b0', '#c9b8ff', '#8eeaff'];
  return spots.slice(0, 6).map(([x, y], i) => {
    const [px, py] = project([x * 100 + 50, y * 100 + 50]);
    return { x: px, y: py - 28, color: colors[i % colors.length], delay: i * 1.3 };
  });
}

const identity: Project = (p) => p;

export function BaseCritters({ state, animate, project = identity }: { state: GameState; animate: boolean; project?: Project }) {
  // New spots and routes each time the base opens; steady while you're on it.
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const night = isNight();
  const villagerCount = Math.min(4, 1 + (state.placed.find((p) => p.itemId === 'lodge')?.level ?? 0) + 1);
  const life = useMemo(() => planLife(state, night, villagerCount), [state, night, villagerCount]);
  // Villagers sitting by the fire aren't also wandering.
  const routes = useMemo(() => planRoutes(state, seed, project, 4 - life.sitters.length), [state, seed, project, life.sitters.length]);
  const butterflies = planButterflies(state, project);
  return (
    <g className="base-critters" pointerEvents="none">

      {routes.map((r, i) => {
        const Art = ART[r.kind];
        if (!animate) {
          return (
            <g key={i} transform={`translate(${r.start[0]} ${r.start[1]}) scale(${CRITTER_SCALE})`}>
              <Art />
            </g>
          );
        }
        const begin = `-${r.delay.toFixed(2)}s`;
        return (
          <g key={i}>
            <animateMotion
              dur={`${r.dur.toFixed(2)}s`}
              begin={begin}
              repeatCount="indefinite"
              path={r.path}
              keyPoints={r.keyPoints}
              keyTimes={r.keyTimes}
              calcMode="linear"
            />
            <g>
              <animateTransform
                attributeName="transform"
                type="scale"
                values={r.flipValues}
                keyTimes={r.flipTimes}
                calcMode="discrete"
                dur={`${r.dur.toFixed(2)}s`}
                begin={begin}
                repeatCount="indefinite"
              />
              <g className={`critter critter--${r.kind} idle`}>
                <animate
                  attributeName="class"
                  values={r.stateValues}
                  keyTimes={r.stateTimes}
                  calcMode="discrete"
                  dur={`${r.dur.toFixed(2)}s`}
                  begin={begin}
                  repeatCount="indefinite"
                />
                <g transform={`scale(${CRITTER_SCALE})`}>
                  <Art />
                </g>
              </g>
            </g>
          </g>
        );
      })}
      {life.bees.map((b, i) => (
        <g key={`bee${i}`} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
          {animate && (
            <animateMotion
              dur={`${2.2 + (i % 3) * 0.5}s`}
              begin={`-${b.delay}s`}
              repeatCount="indefinite"
              path={`M0,0 C${b.size},-${b.size} ${b.size * 2},${b.size / 2} 0,${b.size / 3} C-${b.size * 2},${b.size / 2} -${b.size},-${b.size} 0,0`}
            />
          )}
          <Bee />
        </g>
      ))}
      {butterflies.map((b, i) => (
        <g key={`b${i}`} transform={`translate(${b.x} ${b.y})`}>
          {animate && (
            <animateMotion dur="7s" begin={`-${b.delay}s`} repeatCount="indefinite" path="M0,0 C20,-18 40,10 0,6 C-40,2 -20,-24 0,0" />
          )}
          <g className={animate ? 'base-butterfly' : undefined}>
            <ellipse cx={-3} cy={0} rx={3.5} ry={2.5} fill={b.color} />
            <ellipse cx={3} cy={0} rx={3.5} ry={2.5} fill={b.color} />
            <rect x={-0.6} y={-2} width={1.2} height={4} fill="#2a2a2a" />
          </g>
        </g>
      ))}
    </g>
  );
}

/**
 * Villagers using decorations (training on equipment by day, sitting round the
 * campfire at night). Drawn after the decorations so they appear on them.
 */
export function BaseLife({ state, animate }: { state: GameState; animate: boolean }) {
  const night = isNight();
  const villagerCount = Math.min(4, 1 + (state.placed.find((p) => p.itemId === 'lodge')?.level ?? 0) + 1);
  const life = useMemo(() => planLife(state, night, villagerCount), [state, night, villagerCount]);
  return (
    <g className="base-life" pointerEvents="none">
      {life.glow && <ellipse cx={life.glow[0]} cy={life.glow[1]} rx={46} ry={24} className={animate ? 'base-fireglow is-live' : 'base-fireglow'} />}
      {[...life.athletes, ...life.sitters].map((a, i) => (
        <g key={`a${i}`} transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}>
          <g className={animate ? a.cls : undefined}>
            <g transform={`scale(${a.flip ? -CRITTER_SCALE : CRITTER_SCALE} ${CRITTER_SCALE})`}>
              <Athlete look={a.look} pose={a.pose} />
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}
