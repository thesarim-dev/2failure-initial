import { useMemo } from "react";
import { P } from "./IsoArt";
import { buildableBounds } from "../../game/catalog";
import { occupancy, type GameState } from "../../game/engine";

/**
 * Little life on the island: animals that wander back and forth, ducks on
 * ponds and butterflies over flowers. Barns and coops bring more animals.
 * Uses SVG motion (no state updates), and stays still for reduced motion.
 */

type Kind =
  | "cow"
  | "sheep"
  | "chicken"
  | "bunny"
  | "duck"
  | "pig"
  | "dog"
  | "cat"
  | "fox"
  | "villager1"
  | "villager2"
  | "villager3"
  | "villager4";

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

/*
 * Animals, drawn side-on facing right, standing on the ground line y = 10.
 * Each has a real silhouette, a lit back and shaded belly, thin outlines, and
 * eyes with a catch-light. Class names drive the walk / idle animations.
 */
const GROUND = 10;

/** A leg down to the ground, with a hoof or paw (villagers give their own length). */
function Leg({
  x,
  y,
  h: height,
  w = 3,
  color,
  pair,
  foot,
}: {
  x: number;
  y: number;
  h?: number;
  w?: number;
  color: string;
  pair: "a" | "b";
  foot?: string;
}) {
  const h = height ?? GROUND - y;
  return (
    <g className={`critter-leg leg-${pair}`}>
      <rect
        x={x - w / 2}
        y={y}
        width={w}
        height={h}
        rx={w / 2.6}
        fill={color}
      />
      {foot && (
        <rect
          x={x - w / 2 - 0.2}
          y={y + h - 1.6}
          width={w + 0.4}
          height={1.8}
          rx={0.6}
          fill={foot}
        />
      )}
    </g>
  );
}

/** Soft contact shadow under an animal. */
function Shadow({
  rx,
  ry = rx * 0.26,
  className,
}: {
  rx: number;
  ry?: number;
  className?: string;
}) {
  return (
    <ellipse
      cx={0}
      cy={GROUND + 0.4}
      rx={rx}
      ry={ry}
      fill="url(#crit-shadow)"
      className={className}
    />
  );
}

/** An eye with a catch-light. */
function Eye({
  x,
  y,
  r = 1.1,
  iris = "#1a1a1a",
}: {
  x: number;
  y: number;
  r?: number;
  iris?: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={iris} />
      <circle
        cx={x + r * 0.35}
        cy={y - r * 0.35}
        r={r * 0.35}
        fill="#fff"
        opacity={0.9}
      />
    </g>
  );
}

function Cow() {
  const ol = { stroke: "#3b3b3b", strokeOpacity: 0.45, strokeWidth: 0.7 };
  return (
    <g>
      <Shadow rx={20} />
      <Leg x={-11} y={-2} w={3.4} color="#d9d6cc" foot="#2d2620" pair="b" />
      <Leg x={8} y={-2} w={3.4} color="#d9d6cc" foot="#2d2620" pair="b" />
      <g className="critter-body">
        <g transform="translate(0 -3.5)">
          {/* tail with a tuft */}
          <g className="critter-tail">
            <path
              d="M-17 -6 q-3 3 -2.4 11"
              stroke="#e9e6dc"
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M-19.8 4 q-1.2 2.6 0.4 4.2 q1.2 -1.6 0.6 -4.2 Z"
              fill="#2a2a2a"
            />
          </g>
        </g>
        <Leg x={-6} y={-2} w={3.6} color="#f1eee6" foot="#2d2620" pair="a" />
        <Leg x={12} y={-2} w={3.6} color="#f1eee6" foot="#2d2620" pair="a" />
        <g transform="translate(0 -3.5)">
          {/* barrel body with Holstein patches */}
          <path
            d="M-17 -5 C-17 -10 -11 -11.5 -1 -11 C8 -10.6 13 -10 15 -6 L15.5 2 C14 5.5 9 6.5 0 6.4 C-9 6.4 -15 5.8 -16.6 2.6 Z"
            fill="#f4f2ec"
            {...ol}
          />
          <path
            d="M-12 -10 C-8 -11.5 -3 -10.5 -3.6 -6 C-4.2 -2.4 -9 -1.5 -11.6 -3.6 C-13.6 -5.2 -13.8 -8.6 -12 -10 Z"
            fill="#232323"
          />
          <path
            d="M3 -10.6 C7 -10.8 10 -9 9 -5.6 C8.2 -3 4 -3.6 2.6 -6 C1.8 -7.6 1.6 -10 3 -10.6 Z"
            fill="#232323"
          />
          <path
            d="M-4 1.4 C-1.6 0.2 2.4 1 2.2 3.6 C2 5.6 -2.4 6 -4.2 4.6 C-5.4 3.6 -5.2 2 -4 1.4 Z"
            fill="#232323"
          />
          {/* lit back, shaded belly */}
          <path
            d="M-15 -7 C-10 -10.2 6 -10.4 13 -7.4"
            stroke="#fff"
            strokeOpacity={0.55}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-15.6 2.4 C-10 5.4 8 5.6 14.6 2.2 L14.4 3.6 C9 6.4 -9 6.6 -15.4 3.8 Z"
            fill="#000"
            opacity={0.12}
          />
          <ellipse
            cx={-7}
            cy={6.6}
            rx={3.2}
            ry={1.9}
            fill="#f2a7b6"
            stroke="#c97a8b"
            strokeWidth={0.5}
          />
          <g className="critter-head critter-head--graze">
            <path
              d="M12 -7 C13 -11 15.6 -12.4 18.6 -12.2 C22 -12 24.6 -9.6 25.6 -6.2 C26.6 -2.8 25.6 0.6 22.6 1.2 C19.6 1.8 15.4 0.4 13.6 -2.2 Z"
              fill="#f4f2ec"
              {...ol}
            />
            <path
              d="M15.4 -11.6 C18.4 -12.6 21 -11.6 21.2 -9 C21.4 -6.6 18.6 -5.8 16.8 -6.8 C15.2 -7.8 14.4 -10.6 15.4 -11.6 Z"
              fill="#232323"
            />
            <ellipse
              cx={14.2}
              cy={-10.6}
              rx={3.4}
              ry={1.5}
              fill="#e9e6dc"
              stroke="#3b3b3b"
              strokeOpacity={0.4}
              strokeWidth={0.5}
              transform="rotate(-20 14.2 -10.6)"
            />
            <path
              d="M17 -12.4 q-0.6 -2.8 1.2 -3.6 M20.4 -12.2 q0.8 -2.6 2.6 -2.6"
              stroke="#d8c8a0"
              strokeWidth={1.4}
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx={23.6}
              cy={-1.8}
              rx={3.4}
              ry={2.8}
              fill="#f2a7b6"
              stroke="#c97a8b"
              strokeWidth={0.5}
            />
            <ellipse cx={24.6} cy={-2.4} rx={0.6} ry={0.4} fill="#8a4a58" />
            <ellipse cx={22.8} cy={-2.6} rx={0.6} ry={0.4} fill="#8a4a58" />
            <Eye x={19.6} y={-7.6} r={1.2} />
          </g>
        </g>
      </g>
    </g>
  );
}

function Sheep() {
  const puffs: Array<[number, number, number]> = [
    [-10, -3, 5.4],
    [-5, -7, 5.8],
    [1, -8, 6],
    [7, -6, 5.6],
    [10, -1, 5],
    [-11, 2.4, 5],
    [-4, 2.8, 5.6],
    [3, 2.6, 5.6],
    [8.6, 3, 4.6],
    [-2, -2, 6.4],
  ];
  return (
    <g>
      <Shadow rx={16} />
      <Leg x={-7} y={1} w={2.6} color="#3a3530" foot="#1f1b18" pair="b" />
      <Leg x={5} y={1} w={2.6} color="#3a3530" foot="#1f1b18" pair="b" />
      <g className="critter-body">
        <Leg x={-3} y={1} w={2.6} color="#2c2824" foot="#1a1715" pair="a" />
        <Leg x={9} y={1} w={2.6} color="#2c2824" foot="#1a1715" pair="a" />
        <g transform="translate(0 -3.2)">
          {/* a cloud of wool: shaded puffs, then lit tops */}
          {puffs.map(([x, y, r], k) => (
            <circle key={`o${k}`} cx={x} cy={y} r={r + 0.6} fill="#cfc8b8" />
          ))}
          {puffs.map(([x, y, r], k) => (
            <circle
              key={`w${k}`}
              cx={x}
              cy={y}
              r={r}
              fill={k % 3 === 0 ? "#f3eee2" : "#ece6d8"}
            />
          ))}
          {puffs.map(([x, y, r], k) => (
            <circle
              key={`l${k}`}
              cx={x - r * 0.25}
              cy={y - r * 0.35}
              r={r * 0.45}
              fill="#fffdf6"
              opacity={0.75}
            />
          ))}
          <ellipse
            cx={0}
            cy={4.6}
            rx={12}
            ry={2.6}
            fill="#000"
            opacity={0.08}
          />
          <g className="critter-head critter-head--graze">
            <ellipse
              cx={14.6}
              cy={-5.4}
              rx={4.6}
              ry={5.6}
              fill="#2c2824"
              transform="rotate(18 14.6 -5.4)"
            />
            <ellipse cx={15.6} cy={-3} rx={2.6} ry={2.2} fill="#3d3732" />
            <circle cx={12} cy={-10} r={2.8} fill="#f3eee2" />
            <ellipse
              cx={10.4}
              cy={-6.6}
              rx={3}
              ry={1.3}
              fill="#2c2824"
              transform="rotate(-24 10.4 -6.6)"
            />
            <Eye x={16} y={-7} r={0.9} iris="#e8d9a0" />
            <circle cx={16} cy={-7} r={0.45} fill="#1a1a1a" />
          </g>
        </g>
      </g>
    </g>
  );
}

function Chicken() {
  return (
    <g>
      <Shadow rx={8} />
      <g stroke="#e8902a" strokeWidth={1.4} strokeLinecap="round" fill="none">
        <path
          d="M-2 4.6 v5.2 M-2 9.8 l-1.8 0.5 M-2 9.8 l1.7 0.5"
          className="critter-leg leg-a"
        />
        <path
          d="M2.4 4.6 v5.2 M2.4 9.8 l-1.6 0.5 M2.4 9.8 l1.8 0.5"
          className="critter-leg leg-b"
        />
      </g>
      <g className="critter-body">
        <path
          d="M-6.4 -1 q-5.6 -5 -3.4 -10 q1.6 3.2 3.6 3.4 q-1 -3.8 1.2 -6 q0.8 4 2.8 5.6 Z"
          fill="#f2f0ea"
          stroke="#b9b2a2"
          strokeWidth={0.5}
        />
        <path
          d="M-6.4 -1 q-4.2 -4.2 -2.8 -7.8 q1.4 2.8 3.2 3.2 Z"
          fill="#d1cabb"
        />
        <ellipse
          cx={0}
          cy={0}
          rx={7.6}
          ry={6.2}
          fill="#fbfaf6"
          stroke="#b9b2a2"
          strokeWidth={0.5}
        />
        <ellipse cx={0} cy={2.8} rx={6.6} ry={3} fill="#000" opacity={0.08} />
        <path
          d="M-4.4 -1.6 q4.4 -2.8 8 0.4 q-1.4 4.6 -5.6 4.2 q-2.8 -0.6 -2.4 -4.6 Z"
          fill="#ebe6da"
          stroke="#c9c3b5"
          strokeWidth={0.5}
        />
        <path
          d="M-2.8 0.6 q2.6 1 5 0 M-2.2 2.2 q2.2 0.8 4 0"
          stroke="#c9c3b5"
          strokeWidth={0.6}
          fill="none"
        />
        <g className="critter-head critter-head--peck">
          <circle
            cx={5.4}
            cy={-5.2}
            r={3.7}
            fill="#fbfaf6"
            stroke="#b9b2a2"
            strokeWidth={0.5}
          />
          <path
            d="M3.6 -8.4 q0.8 -2.4 1.8 -0.5 q0.9 -2.4 1.9 -0.4 q1.2 -1.6 1.4 0.4 Z"
            fill="#e5484d"
          />
          <path
            d="M8.6 -4.2 q1.1 1.8 -0.4 2.8 q-0.9 -1 0.4 -2.8 Z"
            fill="#d93a40"
          />
          <polygon points="8.7,-5.8 11.8,-4.9 8.7,-3.9" fill="#f2a541" />
          <polygon points="8.7,-4.9 11.8,-4.9 8.7,-3.9" fill="#c97a1e" />
          <Eye x={6.4} y={-6} r={0.9} />
        </g>
      </g>
    </g>
  );
}

function Bunny() {
  return (
    <g>
      <Shadow rx={9} className="critter-hop-shadow" />
      <g className="critter-hop">
        <path
          d="M-9 4 C-10 -2 -5 -5.4 1 -4.6 C6 -4 8 -0.6 7.4 3.6 C7 7.4 3 9.4 -2 9.4 C-6.6 9.4 -8.8 7.4 -9 4 Z"
          fill="#b89d82"
          stroke="#7d6550"
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        <path
          d="M-7.6 -1.6 C-4 -4.4 2 -4.6 5.4 -2.2"
          stroke="#d8c3ab"
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx={-4.6} cy={5.6} rx={4.4} ry={3.4} fill="#a88d73" />
        <ellipse cx={-5} cy={9.4} rx={3.6} ry={1} fill="#9a8068" />
        <ellipse cx={4.6} cy={9.4} rx={1.8} ry={0.9} fill="#a88d73" />
        <circle
          cx={-9.2}
          cy={1.6}
          r={2.6}
          fill="#fbf8f2"
          stroke="#d6cfc2"
          strokeWidth={0.5}
        />
        <g className="critter-head critter-head--look">
          <ellipse
            cx={6.8}
            cy={-3.8}
            rx={4.6}
            ry={4}
            fill="#b89d82"
            stroke="#7d6550"
            strokeOpacity={0.5}
            strokeWidth={0.6}
          />
          <path
            d="M4.2 -6.6 C2.6 -11 3 -15.6 4.6 -16 C6.2 -16.2 6.6 -11.6 6 -7 Z"
            fill="#b89d82"
            stroke="#7d6550"
            strokeOpacity={0.5}
            strokeWidth={0.5}
          />
          <path
            d="M6.8 -7 C6.6 -11.6 8 -15.8 9.6 -15.6 C11 -15.2 10.4 -10.6 8.6 -6.6 Z"
            fill="#c4a98e"
            stroke="#7d6550"
            strokeOpacity={0.5}
            strokeWidth={0.5}
          />
          <path
            d="M7.6 -8 C7.6 -11.4 8.6 -14.2 9.4 -14 C10 -13.4 9.4 -10.4 8.4 -7.8 Z"
            fill="#f2b6c2"
          />
          <ellipse cx={10.4} cy={-2.6} rx={1.8} ry={1.4} fill="#e8dccb" />
          <circle cx={11.4} cy={-3} r={0.6} fill="#c97a8b" />
          <path
            d="M11.6 -2.6 l3 -0.6 M11.6 -2.2 l3 0.4"
            stroke="#fff"
            strokeOpacity={0.7}
            strokeWidth={0.3}
          />
          <Eye x={8.2} y={-5} r={1} />
        </g>
      </g>
    </g>
  );
}

function Duck() {
  return (
    <g>
      <ellipse
        cx={0}
        cy={6.4}
        rx={12.5}
        ry={2.8}
        fill="#cdeefc"
        opacity={0.45}
      />
      <ellipse cx={0} cy={6.4} rx={8} ry={1.6} fill="#fff" opacity={0.3} />
      <g className="critter-paddle">
        {/* a mallard: grey-brown body, chestnut breast, white tail, blue wing patch */}
        <path
          d="M-10 0 C-10 -4 -5 -5 1 -4.6 C6 -4.2 9 -2.6 9.4 0.6 C9.6 3.6 6 5.6 0 5.6 C-6 5.6 -10 4 -10 0 Z"
          fill="#9c9488"
          stroke="#5e574e"
          strokeOpacity={0.5}
          strokeWidth={0.6}
        />
        <path
          d="M3.6 -4 C7.6 -3.4 9.6 -1 9.4 1.6 C9.2 3.8 6.6 5 4.4 5 C5.6 2 5.4 -1.4 3.6 -4 Z"
          fill="#7a4a30"
        />
        <path
          d="M-10 -0.6 q-3.4 -2 -1.6 -4.6 q1.2 1.8 3 2.4 Z"
          fill="#f4f1ea"
        />
        <path
          d="M-12 -4 q0.6 -1.6 1.8 -1.4"
          stroke="#1f2a24"
          strokeWidth={0.9}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-6.6 -2.6 C-3 -4.2 2 -4 4.6 -2 C2.6 0.6 -3 1 -6.6 -2.6 Z"
          fill="#7d7468"
        />
        <path
          d="M-3.6 -1.6 l5 0.2"
          stroke="#2f5fd0"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <path
          d="M-3.6 -0.6 l5 0.2"
          stroke="#fff"
          strokeWidth={0.4}
          strokeLinecap="round"
          opacity={0.8}
        />
        <path
          d="M5 -4 C5.4 -6.4 6 -8 7.8 -8.6"
          stroke="#f4f1ea"
          strokeWidth={1.6}
          fill="none"
        />
        <ellipse
          cx={7.6}
          cy={-8.4}
          rx={3.6}
          ry={3.2}
          fill="#1f6b46"
          stroke="#123f29"
          strokeWidth={0.5}
        />
        <ellipse
          cx={6.8}
          cy={-9.6}
          rx={1.8}
          ry={1}
          fill="#3fb07a"
          opacity={0.7}
        />
        <path
          d="M10.6 -8.6 q3 0.2 3.6 1.6 q-1.6 0.8 -3.8 0 Z"
          fill="#f2c94c"
          stroke="#b8902a"
          strokeWidth={0.4}
        />
        <Eye x={8.6} y={-9.2} r={0.75} />
      </g>
    </g>
  );
}

function Pig() {
  const ol = { stroke: "#b9667c", strokeOpacity: 0.55, strokeWidth: 0.6 };
  return (
    <g>
      <Shadow rx={15} />
      <Leg x={-8} y={3} w={3.4} color="#e08da1" foot="#7a3b4a" pair="b" />
      <Leg x={5} y={3} w={3.4} color="#e08da1" foot="#7a3b4a" pair="b" />
      <g className="critter-body">
        <path
          d="M-14.4 -3 c-2.6 -0.4 -3.4 2.4 -1.6 3 c1.8 0.6 2 -2 0.2 -2"
          stroke="#e08da1"
          strokeWidth={1.3}
          fill="none"
          strokeLinecap="round"
          className="critter-tail"
        />
        <Leg x={-3} y={3} w={3.4} color="#eb9fb2" foot="#7a3b4a" pair="a" />
        <Leg x={9} y={3} w={3.4} color="#eb9fb2" foot="#7a3b4a" pair="a" />
        <path
          d="M-14.6 -1 C-14.6 -7 -9 -9.4 -1 -9.2 C7 -9 12 -7.4 13.4 -2.6 C14.2 1.2 12 5 5 5.6 C-3 6.2 -10 5.6 -13 3.2 C-14.2 2.2 -14.6 0.8 -14.6 -1 Z"
          fill="#f6b3c4"
          {...ol}
        />
        <path
          d="M-12 -5.6 C-7 -8.4 4 -8.6 10 -5.8"
          stroke="#fde0e8"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
        <path
          d="M-12.6 2.6 C-7 5.4 6 5.6 12 2"
          stroke="#d27f95"
          strokeWidth={1.4}
          fill="none"
          opacity={0.45}
        />
        <g className="critter-head critter-head--graze">
          <path
            d="M10 -6 C12 -9 16 -9.4 18.6 -7 C20.6 -5 20.6 -1 18.4 0.8 C16 2.6 12 2 10.4 -0.6 Z"
            fill="#f6b3c4"
            {...ol}
          />
          <ellipse
            cx={20.4}
            cy={-3}
            rx={2.2}
            ry={2.8}
            fill="#ec9bb0"
            stroke="#b9667c"
            strokeWidth={0.5}
          />
          <ellipse cx={20.8} cy={-3.8} rx={0.5} ry={0.8} fill="#9c4a5e" />
          <ellipse cx={20.8} cy={-2} rx={0.5} ry={0.8} fill="#9c4a5e" />
          <path
            d="M12.6 -8.4 C13 -11.8 16 -12.2 17 -10.6 C16 -9 14.4 -7.6 12.6 -8.4 Z"
            fill="#ec9bb0"
            stroke="#b9667c"
            strokeWidth={0.5}
          />
          <Eye x={16.4} y={-5.4} r={0.95} />
        </g>
      </g>
    </g>
  );
}

function Dog() {
  const ol = { stroke: "#6b4220", strokeOpacity: 0.5, strokeWidth: 0.6 };
  return (
    <g>
      <Shadow rx={13} />
      <Leg x={-8} y={1} w={2.8} color="#a8743e" foot="#4a2e16" pair="b" />
      <Leg x={5} y={1} w={2.8} color="#a8743e" foot="#4a2e16" pair="b" />
      <g className="critter-body">
        <path
          d="M-11 -3 C-15 -5 -17 -9 -15.6 -13 C-13.8 -10.4 -11.6 -8 -9.6 -6 Z"
          fill="#c48a52"
          {...ol}
          className="critter-tail"
        />
        <Leg x={-4} y={1} w={2.8} color="#c48a52" foot="#5a3a1c" pair="a" />
        <Leg x={9} y={1} w={2.8} color="#c48a52" foot="#5a3a1c" pair="a" />
        <path
          d="M-12 -2 C-12 -7 -7 -8.4 0 -8 C6 -7.6 11 -7.4 12.6 -3.6 C13.6 -0.6 12 3 8 3.4 C2 4 -6 4 -10 2.6 C-11.4 2 -12 0.4 -12 -2 Z"
          fill="#d49a60"
          {...ol}
        />
        <path
          d="M-10 -5.4 C-5 -7.8 4 -7.6 10 -5.8"
          stroke="#ecc79a"
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          opacity={0.8}
        />
        <path
          d="M8 -4 C11 -3.4 12.6 -1 12 1.6 C10.6 3 8.6 3.4 7.4 3 C8.6 0.6 8.8 -1.6 8 -4 Z"
          fill="#f0d6b0"
        />
        <g className="critter-head critter-head--look">
          <path
            d="M9 -7 C9.4 -11 13 -13 16.4 -12 C19 -11.2 20 -9 19.8 -7.4 L23.6 -6.6 C24.8 -6.2 24.8 -4 23.4 -3.6 L17 -2.4 C13.4 -1.8 10 -3 9 -7 Z"
            fill="#d49a60"
            {...ol}
          />
          <path
            d="M18 -6.8 L23.4 -6 C24.4 -5.6 24.4 -4.4 23.2 -4 L17.6 -3.2 Z"
            fill="#f0d6b0"
          />
          <ellipse cx={23.8} cy={-5.6} rx={1.1} ry={0.9} fill="#1a1a1a" />
          <path
            d="M11.4 -11.2 C9.6 -11 8.4 -8 9.4 -4.6 C10.8 -5.4 12.4 -8.4 12.6 -10.6 Z"
            fill="#8a5a2a"
          />
          <Eye x={16.6} y={-8.6} r={1} iris="#3a2414" />
          <path
            d="M10.6 -3.6 C12 -2 14.4 -1.6 16 -2.4"
            stroke="#d6453d"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={13.6} cy={-1.2} r={0.9} fill="#f7c948" />
        </g>
      </g>
    </g>
  );
}

function Cat() {
  const ol = { stroke: "#4d4f5c", strokeOpacity: 0.5, strokeWidth: 0.5 };
  return (
    <g>
      <Shadow rx={11} />
      <Leg x={-6} y={2} w={2.1} color="#7d7f8c" foot="#5f6170" pair="b" />
      <Leg x={4} y={2} w={2.1} color="#7d7f8c" foot="#5f6170" pair="b" />
      <g className="critter-body">
        <path
          d="M-9 -2 C-13 -3 -14 -7 -12 -10 C-11 -12 -12.6 -13.6 -14 -13"
          stroke="#8e909e"
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          className="critter-tail"
        />
        <Leg x={-2} y={2} w={2.1} color="#9a9caa" foot="#7d7f8c" pair="a" />
        <Leg x={8} y={2} w={2.1} color="#9a9caa" foot="#7d7f8c" pair="a" />
        <path
          d="M-10 -1 C-10 -5 -5 -6 0 -5.8 C5 -5.6 9 -5 10 -2 C10.6 0.6 9 3 5 3.2 C0 3.6 -6 3.4 -8.6 2 C-9.6 1.2 -10 0.2 -10 -1 Z"
          fill="#a3a5b3"
          {...ol}
        />
        <path
          d="M-6 -5.4 l1.4 3.2 M-2 -5.8 l1 3.4 M2 -5.6 l0.6 3.2 M6 -5 l0.2 3"
          stroke="#6d6f7c"
          strokeWidth={1.1}
          strokeLinecap="round"
        />
        <path
          d="M-7 2.2 C-2 3.6 4 3.4 8 2"
          stroke="#d8d9e0"
          strokeWidth={1.2}
          fill="none"
          opacity={0.8}
        />
        <g className="critter-head critter-head--look">
          <ellipse cx={11} cy={-5.6} rx={4.4} ry={3.8} fill="#a3a5b3" {...ol} />
          <path d="M8.2 -8.4 L8.6 -12.6 L11 -9.2 Z" fill="#a3a5b3" {...ol} />
          <path
            d="M11.6 -9.4 L13.6 -12.8 L14.2 -8.6 Z"
            fill="#a3a5b3"
            {...ol}
          />
          <path d="M8.9 -9.4 L9.1 -11.4 L10.2 -9.6 Z" fill="#f2b6c2" />
          <path
            d="M9.6 -7.6 l1 1.2 M11.6 -8 l0 1.4"
            stroke="#6d6f7c"
            strokeWidth={0.7}
          />
          <ellipse cx={14.4} cy={-4.4} rx={1.8} ry={1.3} fill="#e6e7ec" />
          <path d="M14.8 -5 l-0.6 0.6 l-0.6 -0.6 Z" fill="#d17a8a" />
          <path
            d="M15 -4 l3.2 -0.8 M15 -3.6 l3.2 0.4"
            stroke="#fff"
            strokeOpacity={0.75}
            strokeWidth={0.3}
          />
          <ellipse cx={12.4} cy={-6.2} rx={0.85} ry={1} fill="#7fc24a" />
          <ellipse cx={12.4} cy={-6.2} rx={0.25} ry={0.85} fill="#1a1a1a" />
        </g>
      </g>
    </g>
  );
}

function Fox() {
  const ol = { stroke: "#8a3b12", strokeOpacity: 0.5, strokeWidth: 0.5 };
  return (
    <g>
      <Shadow rx={13} />
      <Leg x={-6} y={2} w={2.2} color="#2a1e18" pair="b" />
      <Leg x={4} y={2} w={2.2} color="#2a1e18" pair="b" />
      <g className="critter-body">
        <g className="critter-tail">
          <path
            d="M-9 -1 C-15 -1 -21 -4 -22 -9 C-18 -9 -14 -6.4 -9 -4.6 Z"
            fill="#e5793a"
            {...ol}
          />
          <path
            d="M-18.6 -8.4 C-20.4 -8.8 -21.6 -9.2 -22 -9.2 C-21.6 -7.4 -20.6 -6.6 -19 -6.2 Z"
            fill="#fbf7f0"
          />
        </g>
        <Leg x={-2} y={2} w={2.2} color="#3a2a22" pair="a" />
        <Leg x={8} y={2} w={2.2} color="#3a2a22" pair="a" />
        <path
          d="M-10 -1 C-10 -5 -5 -6 0 -5.8 C5 -5.6 9 -5 10 -2 C10.6 0.6 9 3 5 3.2 C0 3.6 -6 3.4 -8.6 2 C-9.6 1.2 -10 0.2 -10 -1 Z"
          fill="#e5793a"
          {...ol}
        />
        <path
          d="M-8 -4.6 C-3 -6 4 -5.8 8 -4.4"
          stroke="#f3a06a"
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M6.6 -3.6 C9.6 -3 10.8 -0.6 9.8 1.8 C8.6 2.8 7 3 6 2.6 C7.2 0.4 7.4 -1.6 6.6 -3.6 Z"
          fill="#fbf7f0"
        />
        <g className="critter-head critter-head--look">
          <path
            d="M7.6 -6.4 C8 -9 10.6 -10.2 13 -9.6 L19.6 -5.4 C20.4 -4.8 20 -3.6 19 -3.6 L12.6 -2.6 C10 -2.4 7.8 -3.8 7.6 -6.4 Z"
            fill="#e5793a"
            {...ol}
          />
          <path
            d="M12.6 -5.6 L19.6 -5 C20.2 -4.4 19.8 -3.6 19 -3.6 L12.4 -2.8 Z"
            fill="#fbf7f0"
          />
          <ellipse cx={19.6} cy={-4.6} rx={0.8} ry={0.7} fill="#1a1a1a" />
          <path d="M8.4 -8.4 L8.4 -13 L11 -9.6 Z" fill="#3a2418" />
          <path d="M11 -9.6 L13.4 -13.4 L13.6 -9 Z" fill="#e5793a" {...ol} />
          <path
            d="M11.8 -9.8 L13.2 -12.2 L13.2 -9.4 Z"
            fill="#3a2418"
            opacity={0.7}
          />
          <Eye x={13.4} y={-7} r={0.85} iris="#2a1a0c" />
        </g>
      </g>
    </g>
  );
}

/**
 * Villagers: little townsfolk in the same chunky style as the animals. They
 * walk with the same leg swing and look around when they stop.
 */
function Villager({
  shirt,
  pants,
  skin,
  hair,
  carry,
}: {
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  carry?: "basket" | "wood";
}) {
  return (
    <g>
      <ellipse cx={0} cy={11} rx={6.5} ry={2} fill="#000" opacity={0.25} />
      <Leg x={-1.8} y={2} h={8.5} w={2.6} color={pants} pair="b" />
      <g className="critter-body">
        <Leg x={1.8} y={2} h={8.5} w={2.6} color={pants} pair="a" />
        <rect
          x={-4.6}
          y={-9.5}
          width={9.2}
          height={12.5}
          rx={3.6}
          fill={shirt}
        />
        <rect
          x={-4.6}
          y={-9.5}
          width={9.2}
          height={12.5}
          rx={3.6}
          fill="url(#hf-body)"
        />
        <rect
          x={-4.6}
          y={0.6}
          width={9.2}
          height={1.6}
          fill="#000"
          opacity={0.18}
        />
        {carry === "basket" && (
          <g>
            <path
              d="M3 -3 Q 7.5 -9 12 -3"
              stroke="#7a4a20"
              strokeWidth={1}
              fill="none"
            />
            <path
              d="M2.6 -3 H12.4 L11.4 2 H3.6 Z"
              fill="#c08a4a"
              stroke="#7a4a20"
              strokeWidth={0.7}
            />
            <circle cx={5.6} cy={-3.6} r={1.5} fill="#e5484d" />
            <circle cx={8.6} cy={-3.8} r={1.5} fill="#f2a541" />
          </g>
        )}
        {carry === "wood" && (
          <g>
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={1.4}
                y={-6.4 + i * 2.6}
                width={9.6}
                height={2.4}
                rx={1.2}
                fill="#a0703c"
                stroke="#5a3a1c"
                strokeWidth={0.6}
              />
            ))}
          </g>
        )}
        <rect
          x={0.8}
          y={-7.6}
          width={2.8}
          height={carry ? 5.6 : 8.6}
          rx={1.4}
          fill={shirt}
          stroke="#000"
          strokeOpacity={0.15}
          strokeWidth={0.5}
        />
        <g className="critter-head critter-head--look">
          <circle cx={0.6} cy={-13.6} r={4.4} fill={skin} />
          <path
            d="M-3.8 -13.8 Q -3.6 -18.8 0.8 -18.4 Q 5 -18.2 5 -14.4 Q 2.4 -16.2 -0.4 -15.6 Q -2.6 -15 -3.8 -13.8 Z"
            fill={hair}
          />
          <circle cx={3} cy={-13.6} r={0.75} fill="#1a1a1a" />
          <circle cx={3.6} cy={-11.8} r={0.9} fill="#ff8a8a" opacity={0.5} />
        </g>
      </g>
    </g>
  );
}

type Look = { shirt: string; pants: string; skin: string; hair: string };
const LOOKS: Look[] = [
  { shirt: "#e5484d", pants: "#3b3f58", skin: "#f1c27d", hair: "#5a3825" },
  { shirt: "#3b82f6", pants: "#4b3a2a", skin: "#c68642", hair: "#1f1a17" },
  { shirt: "#f2a541", pants: "#3f4a3a", skin: "#8d5524", hair: "#141010" },
  { shirt: "#8b5cf6", pants: "#2f3542", skin: "#ffdbac", hair: "#c58b3a" },
];
type Pose = "hang" | "dip" | "punch" | "jump" | "sit";

/** A villager mid-exercise (or sitting by the fire). Feet at y ≈ 11, hands where the pose needs them. */
function Athlete({ look, pose }: { look: Look; pose: Pose }) {
  const { shirt, pants, skin, hair } = look;
  const arm = (x1: number, y1: number, x2: number, y2: number) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={shirt}
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  );
  const leg = (x1: number, y1: number, x2: number, y2: number) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={pants}
      strokeWidth={2.6}
      strokeLinecap="round"
    />
  );
  const hand = (x: number, y: number) => (
    <circle cx={x} cy={y} r={1.4} fill={skin} />
  );
  const head = (
    <g>
      <circle cx={0.6} cy={-13.6} r={4.4} fill={skin} />
      <path
        d="M-3.8 -13.8 Q -3.6 -18.8 0.8 -18.4 Q 5 -18.2 5 -14.4 Q 2.4 -16.2 -0.4 -15.6 Q -2.6 -15 -3.8 -13.8 Z"
        fill={hair}
      />
      <circle cx={3} cy={-13.6} r={0.75} fill="#1a1a1a" />
    </g>
  );
  const torso = (
    <g>
      <rect x={-4.6} y={-9.5} width={9.2} height={12.5} rx={3.6} fill={shirt} />
      <rect
        x={-4.6}
        y={-9.5}
        width={9.2}
        height={12.5}
        rx={3.6}
        fill="url(#hf-body)"
      />
    </g>
  );
  if (pose === "sit") {
    return (
      <g>
        <rect
          x={-7}
          y={6}
          width={14}
          height={4.5}
          rx={2.2}
          fill="#8a5a2b"
          stroke="#5a3a1c"
          strokeWidth={0.6}
        />
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
    pose === "jump" ? (
      <g>
        {leg(-1.6, 2.5, -3, 7)}
        {leg(-3, 7, -1.4, 10.5)}
        {leg(1.8, 2.5, 3.4, 7)}
        {leg(3.4, 7, 2, 10.5)}
      </g>
    ) : (
      <g>
        {leg(-1.6, 2.5, -1.8, 10.5)}
        {leg(1.8, 2.5, pose === "punch" ? 4.5 : 1.8, 10.5)}
      </g>
    );
  return (
    <g>
      {pose !== "hang" && pose !== "dip" && (
        <ellipse cx={0} cy={11} rx={6.5} ry={2} fill="#000" opacity={0.25} />
      )}
      {legs}
      {torso}
      {pose === "hang" && (
        <>
          {arm(-3.6, -8, -5, -23)}
          {arm(3.6, -8, 5, -23)}
          {hand(-5, -23.5)}
          {hand(5, -23.5)}
        </>
      )}
      {pose === "dip" && (
        <>
          {arm(-4, -8, -7, 0)}
          {arm(4, -8, 7, 0)}
          {hand(-7, 0.5)}
          {hand(7, 0.5)}
        </>
      )}
      {pose === "punch" && (
        <>
          {arm(-2, -7, 2, -3)}
          <g className="ex-punch">
            {arm(2, -7, 12, -7)}
            {hand(12.5, -7)}
          </g>
        </>
      )}
      {pose === "jump" && (
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
      <ellipse
        cx={0}
        cy={-2}
        rx={2.2}
        ry={1.4}
        fill="#ffffff"
        opacity={0.85}
        className="base-bee-wing"
      />
      <ellipse cx={0} cy={0} rx={2.6} ry={1.8} fill="#f7c948" />
      <rect x={-0.6} y={-1.8} width={0.9} height={3.6} fill="#2a2a2a" />
      <rect x={1.1} y={-1.6} width={0.8} height={3.2} fill="#2a2a2a" />
    </g>
  );
}

export const ART: Record<Kind, () => JSX.Element> = {
  villager1: () => (
    <Villager
      shirt="#e5484d"
      pants="#3b3f58"
      skin="#f1c27d"
      hair="#5a3825"
      carry="basket"
    />
  ),
  villager2: () => (
    <Villager shirt="#3b82f6" pants="#4b3a2a" skin="#c68642" hair="#1f1a17" />
  ),
  villager3: () => (
    <Villager
      shirt="#f2a541"
      pants="#3f4a3a"
      skin="#8d5524"
      hair="#141010"
      carry="wood"
    />
  ),
  villager4: () => (
    <Villager shirt="#8b5cf6" pants="#2f3542" skin="#ffdbac" hair="#c58b3a" />
  ),
  cow: Cow,
  sheep: Sheep,
  chicken: Chicken,
  bunny: Bunny,
  duck: Duck,
  pig: Pig,
  dog: Dog,
  cat: Cat,
  fox: Fox,
};
/** Walking speed in board units per second. */
const SPEED: Record<Kind, number> = {
  cow: 16,
  sheep: 18,
  pig: 20,
  chicken: 34,
  bunny: 42,
  duck: 22,
  dog: 40,
  cat: 30,
  fox: 36,
  villager1: 22,
  villager2: 24,
  villager3: 20,
  villager4: 23,
};
/** Animals are drawn a bit larger than life so they read as cute on phones. */
const CRITTER_SCALE = 1.45;
/** Realistic sizes next to people: small animals are small, cows are big. */
const KIND_SIZE: Partial<Record<Kind, number>> = {
  chicken: 0.62,
  bunny: 0.6,
  duck: 0.72,
  cat: 0.7,
  fox: 0.85,
  dog: 0.85,
  pig: 0.95,
  sheep: 0.95,
  cow: 1.12,
};

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
function buildRoute(
  kind: Kind,
  points: Point[],
  rnd: () => number,
  pauseScale = 1,
): Route {
  const loop = [...points, points[0]];
  const lengths = loop
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - loop[i][0], p[1] - loop[i][1]));
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
    flipValues.push(dx < 0 ? "-1 1" : "1 1");
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
  const stateValues = stateTimes.map(
    (_, i) => `${base} ${i % 2 === 0 ? "idle" : "walk"}`,
  );
  return {
    stateValues: stateValues.join(";"),
    stateTimes: stateTimes.map(fmt).join(";"),
    kind,
    path: `M${loop.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")}`,
    keyPoints: keys.map(fmt).join(";"),
    keyTimes: times.map(fmt).join(";"),
    flipValues: flipValues.join(";"),
    flipTimes: flipTimes.map(fmt).join(";"),
    dur,
    delay: rnd() * dur,
    start: points[0],
  };
}

type Project = (p: [number, number]) => [number, number];

function planRoutes(
  state: GameState,
  seed: number,
  project: Project,
  wanderingVillagers = 4,
): Route[] {
  const rnd = mulberry32(seed);
  const { min, max } = buildableBounds(state.landLevel);
  const occupied = occupancy(state);
  const isWater = (x: number, y: number) =>
    state.terrain?.[`${x},${y}`] === "water";
  const count = (id: string) =>
    state.placed.filter((p) => p.itemId === id && p.level > 0).length;

  const land: Point[] = [];
  const water: Point[] = [];
  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      // A random spot inside the tile, so animals don't line up on a grid.
      const point: Point = [
        x * 100 + 25 + rnd() * 50,
        y * 100 + 45 + rnd() * 40,
      ];
      (isWater(x, y) ? water : land).push(point);
    }
  }
  const pick = (pool: Point[]) => pool[Math.floor(rnd() * pool.length)];

  const kinds: Kind[] = ["cow", "chicken", "bunny"];
  const wild: Kind[] = ["bunny", "cat", "dog", "fox", "chicken"];
  const extras = Math.min(6, 2 + state.landLevel);
  for (let i = 0; i < extras; i++)
    kinds.push(wild[Math.floor(rnd() * wild.length)]);
  for (let i = 0; i < Math.min(3, count("barn")); i++)
    kinds.push("cow", "sheep", "pig");
  for (let i = 0; i < Math.min(3, count("coop")); i++)
    kinds.push("chicken", "chicken");

  const routes: Route[] = [];
  if (land.length >= 2) {
    for (const kind of kinds) {
      const stops = 2 + Math.floor(rnd() * 3);
      const first = pick(land);
      const points: Point[] = [first];
      // Wander locally: each next stop is within a few tiles of the last.
      for (let i = 1; i < stops; i++) {
        const prev = points[i - 1];
        const near = land.filter(
          (p) =>
            Math.abs(p[0] - prev[0]) < 360 && Math.abs(p[1] - prev[1]) < 300,
        );
        points.push(pick(near.length > 1 ? near : land));
      }
      routes.push(buildRoute(kind, points.map(project), rnd));
    }
  }
  // Villagers live near the buildings: one for the HQ, more as the Lodge grows.
  const structures = state.placed.filter(
    (p) =>
      p.level > 0 &&
      ["hq", "lodge", "forge", "watchtower", "spring", "yard"].includes(
        p.itemId,
      ),
  );
  const lodgeLevel = state.placed.find((p) => p.itemId === "lodge")?.level ?? 0;
  const villagers = Math.min(
    4,
    1 + lodgeLevel + (structures.length > 3 ? 1 : 0),
  );
  const nearHome = land.filter((pt) =>
    structures.some(
      (st) =>
        Math.abs(pt[0] - (st.x * 100 + 50)) < 320 &&
        Math.abs(pt[1] - (st.y * 100 + 50)) < 320,
    ),
  );
  const villageKinds: Kind[] = [
    "villager1",
    "villager2",
    "villager3",
    "villager4",
  ];
  // Painted paths: villagers stroll along them (there and back), not across the grass.
  const pathTiles = Object.entries(state.terrain ?? {})
    .filter(([key, t]) => t === "path" && !occupied.has(key))
    .map(([key]) => key.split(",").map(Number) as Point);
  const onPath = new Set(pathTiles.map(([x, y]) => `${x},${y}`));
  const pathWalk = (): Point[] => {
    let [x, y] = pathTiles[Math.floor(rnd() * pathTiles.length)];
    const walk: Point[] = [[x, y]];
    let prev: Point | null = null;
    for (let step = 0; step < 9; step++) {
      const from: Point | null = prev;
      const next = (
        [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ] as Point[]
      ).filter(
        ([nx, ny]) =>
          onPath.has(`${nx},${ny}`) &&
          !(from && from[0] === nx && from[1] === ny),
      );
      if (!next.length) break;
      prev = [x, y];
      [x, y] = next[Math.floor(rnd() * next.length)];
      walk.push([x, y]);
    }
    const centres = walk.map(
      ([tx, ty]) =>
        [tx * 100 + 40 + rnd() * 20, ty * 100 + 45 + rnd() * 20] as Point,
    );
    return centres.length > 1
      ? [...centres, ...centres.slice(1, -1).reverse()]
      : centres;
  };
  for (let i = 0; i < Math.min(villagers, wanderingVillagers); i++) {
    if (pathTiles.length >= 3) {
      routes.push(
        buildRoute(villageKinds[i], pathWalk().map(project), rnd, 0.3),
      );
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
    routes.push(buildRoute("duck", points.map(project), rnd));
  }
  // Ducks come to visit lily pads: two paddle slow circles around each pad.
  for (const pad of state.placed.filter(
    (p) => p.itemId === "lilypad" && p.level > 0,
  )) {
    for (let d = 0; d < 2; d++) {
      const cx = pad.x * 100 + 50;
      const cy = pad.y * 100 + 50;
      const r = 26 + d * 10;
      const ring: Point[] = [0, 1, 2, 3].map((k) => [
        cx + Math.cos((k + d * 0.5) * (Math.PI / 2)) * r,
        cy + Math.sin((k + d * 0.5) * (Math.PI / 2)) * r * 0.8,
      ]);
      routes.push(buildRoute("duck", ring.map(project), rnd, 0.4));
    }
  }
  return routes;
}

/** Whether it's night on the base (real local time; tests can set window.__baseHour). */
function isNight(): boolean {
  const forced = (window as unknown as { __baseHour?: number }).__baseHour;
  const hour = typeof forced === "number" ? forced : new Date().getHours();
  return hour >= 19 || hour < 6;
}

type Placed = {
  x: number;
  y: number;
  flip: boolean;
  pose: Pose;
  look: Look;
  cls: string;
};

/**
 * Life that comes from decorations: by day an athlete on each piece of
 * training equipment; at night villagers gather round the campfire; bees by
 * every beehive.
 */
function planLife(state: GameState, night: boolean, villagers: number) {
  const built = (id: string) =>
    state.placed.filter((p) => p.itemId === id && p.level > 0);
  const athletes: Placed[] = [];
  const sitters: Placed[] = [];
  let glow: [number, number] | null = null;
  const S = CRITTER_SCALE;
  if (!night) {
    let n = 0;
    const add = (
      pose: Pose,
      at: [number, number],
      cls: string,
      flip = false,
    ) => {
      if (athletes.length >= 4) return;
      athletes.push({
        x: at[0],
        y: at[1],
        flip,
        pose,
        look: LOOKS[n++ % LOOKS.length],
        cls,
      });
    };
    for (const b of built("pullupbar")) {
      const [hx, hy] = P(b.x * 100 + 50, b.y * 100 + 51, 81);
      add("hang", [hx, hy + 23.5 * S], "ex-pullup");
    }
    for (const b of built("dipbars")) {
      const [hx, hy] = P(b.x * 100 + 50, b.y * 100 + 50, 50);
      add("dip", [hx, hy - 0.5 * S], "ex-dip");
    }
    for (const b of built("punchbag")) {
      const at = P(b.x * 100 + 38, b.y * 100 + 64, 0);
      const bag = P(b.x * 100 + 62, b.y * 100 + 50, 0);
      add("punch", [at[0], at[1] - 11 * S], "ex-box", bag[0] < at[0]);
    }
    for (const b of built("plyobox")) {
      // In front of the box (not behind it), so the whole jump is visible.
      const at = P(b.x * 100 + 56, b.y * 100 + 100, 0);
      add("jump", [at[0], at[1] - 11 * S], "ex-jump");
    }
  } else {
    const fire = built("campfire")[0];
    if (fire) {
      const cx = fire.x * 100 + 50;
      const cy = fire.y * 100 + 50;
      const centre = P(cx, cy, 0);
      glow = centre;
      const seats = [200, 290, 20].slice(
        0,
        Math.max(1, Math.min(3, villagers)),
      );
      seats.forEach((deg, i) => {
        const [sx, sy] = P(
          cx + Math.cos((deg * Math.PI) / 180) * 34,
          cy + Math.sin((deg * Math.PI) / 180) * 34,
          0,
        );
        sitters.push({
          x: sx,
          y: sy - 11 * S,
          flip: sx > centre[0],
          pose: "sit",
          look: LOOKS[i % LOOKS.length],
          cls: "ex-sit",
        });
      });
    }
  }
  const bees = built("beehive").flatMap((h) =>
    [0, 1, 2, 3].map((i) => {
      const [bx, by] = P(h.x * 100 + 50, h.y * 100 + 50, 44);
      return {
        x: bx + (i - 1.5) * 6,
        y: by - (i % 2) * 6,
        delay: i * 0.9,
        size: i % 2 ? 12 : 16,
      };
    }),
  );
  return { athletes, sitters, glow, bees };
}

/** Butterflies flutter over flower patches, gardens and meadows. */
function planButterflies(
  state: GameState,
  project: Project,
): Array<{ x: number; y: number; color: string; delay: number }> {
  const spots: Array<[number, number]> = [];
  for (const p of state.placed)
    if (p.level > 0 && (p.itemId === "flowers" || p.itemId === "garden"))
      spots.push([p.x, p.y]);
  for (const [key, t] of Object.entries(state.terrain ?? {})) {
    if (t === "meadow")
      spots.push(key.split(",").map(Number) as [number, number]);
  }
  const colors = ["#ffd1ea", "#fff4b0", "#c9b8ff", "#8eeaff"];
  return spots.slice(0, 6).map(([x, y], i) => {
    const [px, py] = project([x * 100 + 50, y * 100 + 50]);
    return {
      x: px,
      y: py - 28,
      color: colors[i % colors.length],
      delay: i * 1.3,
    };
  });
}

const identity: Project = (p) => p;

export function BaseCritters({
  state,
  animate,
  project = identity,
}: {
  state: GameState;
  animate: boolean;
  project?: Project;
}) {
  // New spots and routes each time the base opens; steady while you're on it.
  const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const night = isNight();
  const villagerCount = Math.min(
    4,
    1 + (state.placed.find((p) => p.itemId === "lodge")?.level ?? 0) + 1,
  );
  const life = useMemo(
    () => planLife(state, night, villagerCount),
    [state, night, villagerCount],
  );
  // Villagers sitting by the fire aren't also wandering.
  const routes = useMemo(
    () => planRoutes(state, seed, project, 4 - life.sitters.length),
    [state, seed, project, life.sitters.length],
  );
  const butterflies = planButterflies(state, project);
  return (
    <g className="base-critters" pointerEvents="none">
      {routes.map((r, i) => {
        const Art = ART[r.kind];
        if (!animate) {
          return (
            <g
              key={i}
              transform={`translate(${r.start[0]} ${r.start[1]}) scale(${CRITTER_SCALE})`}
            >
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
                <g
                  transform={`translate(0 ${(GROUND * CRITTER_SCALE * (1 - (KIND_SIZE[r.kind] ?? 1))).toFixed(2)}) scale(${(CRITTER_SCALE * (KIND_SIZE[r.kind] ?? 1)).toFixed(3)})`}
                >
                  <Art />
                </g>
              </g>
            </g>
          </g>
        );
      })}
      {life.bees.map((b, i) => (
        <g
          key={`bee${i}`}
          transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}
        >
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
            <animateMotion
              dur="7s"
              begin={`-${b.delay}s`}
              repeatCount="indefinite"
              path="M0,0 C20,-18 40,10 0,6 C-40,2 -20,-24 0,0"
            />
          )}
          <g className={animate ? "base-butterfly" : undefined}>
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
export function BaseLife({
  state,
  animate,
}: {
  state: GameState;
  animate: boolean;
}) {
  const night = isNight();
  const villagerCount = Math.min(
    4,
    1 + (state.placed.find((p) => p.itemId === "lodge")?.level ?? 0) + 1,
  );
  const life = useMemo(
    () => planLife(state, night, villagerCount),
    [state, night, villagerCount],
  );
  return (
    <g className="base-life" pointerEvents="none">
      {life.glow && (
        <ellipse
          cx={life.glow[0]}
          cy={life.glow[1]}
          rx={46}
          ry={24}
          className={animate ? "base-fireglow is-live" : "base-fireglow"}
        />
      )}
      {[...life.athletes, ...life.sitters].map((a, i) => (
        <g
          key={`a${i}`}
          transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`}
        >
          <g className={animate ? a.cls : undefined}>
            <g
              transform={`scale(${a.flip ? -CRITTER_SCALE : CRITTER_SCALE} ${CRITTER_SCALE})`}
            >
              <Athlete look={a.look} pose={a.pose} />
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}
