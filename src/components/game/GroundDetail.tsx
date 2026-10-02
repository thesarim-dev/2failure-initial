import { memo, type ReactNode } from 'react';
import { buildableBounds } from '../../game/catalog';
import { occupancy, type GameState } from '../../game/engine';

/**
 * Small upright details standing on the ground tiles, drawn in screen space
 * (unlike the flat tile paint) so the ground has real dimension: grass tufts,
 * meadow flowers, pebbles, shells, snow mounds and reeds. Tiles under
 * buildings get none, so nothing pokes through.
 */

type Project = (p: [number, number]) => [number, number];

/** How high each ground sits; a higher neighbour casts a soft edge shadow. */
export const TERRAIN_RANK: Record<string, number> = { grass: 3, meadow: 3, snow: 3, plaza: 2, sand: 2, dirt: 1, water: 0 };

function hash(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function Tuft({ x, y, scale = 1, dark, light, sway, delay }: { x: number; y: number; scale?: number; dark: string; light: string; sway: boolean; delay: number }) {
  const s = scale;
  return (
    <g className={sway ? 'base-sway' : undefined} style={sway ? { animationDelay: `${delay}s` } : undefined}>
      <path
        d={`M${x - 3 * s} ${y} q-1 ${-5 * s} ${-3.5 * s} ${-8 * s} M${x - 1 * s} ${y} q0 ${-7 * s} ${0.5 * s} ${-11 * s} M${x + 1.5 * s} ${y} q1 ${-6 * s} ${3.5 * s} ${-9 * s}`}
        stroke={dark}
        strokeWidth={1.7 * s}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${x} ${y} q0.5 ${-5 * s} ${2 * s} ${-7.5 * s} M${x - 2 * s} ${y} q-0.5 ${-4 * s} ${-1.5 * s} ${-6 * s}`}
        stroke={light}
        strokeWidth={1.3 * s}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function Flower({ x, y, color, tall, sway, delay }: { x: number; y: number; color: string; tall: number; sway: boolean; delay: number }) {
  return (
    <g className={sway ? 'base-sway' : undefined} style={sway ? { animationDelay: `${delay}s` } : undefined}>
      <path d={`M${x} ${y} q1 ${-tall / 2} 0 ${-tall}`} stroke="#3c8a45" strokeWidth={1.3} fill="none" />
      <ellipse cx={x + 2} cy={y - tall * 0.45} rx={2.4} ry={1.1} fill="#4fae5a" transform={`rotate(-25 ${x + 2} ${y - tall * 0.45})`} />
      {[0, 72, 144, 216, 288].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <ellipse key={deg} cx={x + Math.cos(r) * 2.2} cy={y - tall + Math.sin(r) * 1.4} rx={1.9} ry={1.4} fill={color} />;
      })}
      <circle cx={x} cy={y - tall} r={1.2} fill="#fff4b0" />
    </g>
  );
}

function Pebble({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <ellipse cx={x + r * 0.3} cy={y + r * 0.35} rx={r * 1.1} ry={r * 0.45} fill="#000" opacity={0.22} />
      <ellipse cx={x} cy={y} rx={r} ry={r * 0.62} fill="#9a8a78" />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.2} rx={r * 0.5} ry={r * 0.25} fill="#c8bba9" />
    </g>
  );
}

function Shell({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <path d={`M${x - 3} ${y} q3 -5 6 0 Z`} fill={color} />
      <path d={`M${x - 1.5} ${y} l1.5 -3.4 M${x + 1.5} ${y} l-1.5 -3.4`} stroke="#000" strokeOpacity={0.2} strokeWidth={0.6} />
    </g>
  );
}

function SnowMound({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 1} rx={r * 1.1} ry={r * 0.4} fill="#9fb3c8" opacity={0.5} />
      <ellipse cx={x} cy={y - r * 0.2} rx={r} ry={r * 0.55} fill="#ffffff" />
      <ellipse cx={x - r * 0.3} cy={y - r * 0.4} rx={r * 0.45} ry={r * 0.2} fill="#ffffff" opacity={0.9} />
      <ellipse cx={x + r * 0.3} cy={y} rx={r * 0.6} ry={r * 0.25} fill="#dbe6f2" />
    </g>
  );
}

function Reeds({ x, y, sway, delay }: { x: number; y: number; sway: boolean; delay: number }) {
  return (
    <g className={sway ? 'base-sway' : undefined} style={sway ? { animationDelay: `${delay}s` } : undefined}>
      {[-3, 0, 3].map((dx, i) => (
        <g key={dx}>
          <path d={`M${x + dx} ${y} q${dx * 0.3} -8 ${dx * 0.5} -${14 + i * 3}`} stroke="#3c8a45" strokeWidth={1.4} fill="none" />
          {i === 1 && <rect x={x + dx - 1.1} y={y - 20} width={2.2} height={5} rx={1} fill="#7a4a24" />}
        </g>
      ))}
    </g>
  );
}

const MEADOW_COLORS = ['#ff9ed4', '#fff4b0', '#c9b8ff', '#ffffff', '#ffb26b', '#8eeaff'];

function GroundDetailInner({ state, project }: { state: GameState; project: Project }) {
  const { min, max } = buildableBounds(state.landLevel);
  const occupied = occupancy(state);
  const terrainAt = (x: number, y: number) =>
    x < min || x > max || y < min || y > max ? null : state.terrain?.[`${x},${y}`] ?? 'grass';
  // Sorted back to front so nearer details overlap farther ones.
  const items: Array<{ depth: number; node: ReactNode }> = [];
  const at = (x: number, y: number, fx: number, fy: number) => project([x * 100 + fx, y * 100 + fy]);

  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      const t = terrainAt(x, y) ?? 'grass';
      const r = (salt: number, span = 76) => 12 + (hash(x, y, salt) % span);
      const sway = (salt: number) => hash(x, y, salt) % 3 === 0;
      const delay = (hash(x, y, 9) % 30) / 10;
      const push = (fx: number, fy: number, node: ReactNode) => items.push({ depth: x * 100 + fx + y * 100 + fy, node });

      if (t === 'grass') {
        const count = 3 + (hash(x, y, 1) % 3);
        for (let i = 0; i < count; i++) {
          const fx = r(10 + i);
          const fy = r(20 + i);
          const [px, py] = at(x, y, fx, fy);
          push(fx, fy, <Tuft key={`g${x},${y},${i}`} x={px} y={py} dark="#2f6a39" light="#6fbf6a" sway={sway(30 + i)} delay={delay + i * 0.3} />);
        }
        if (hash(x, y, 40) % 6 === 0) {
          const [px, py] = at(x, y, r(41), r(42));
          push(r(41), r(42), <Flower key={`gf${x},${y}`} x={px} y={py} color={hash(x, y, 43) % 2 ? '#ffffff' : '#fff4b0'} tall={7} sway={false} delay={0} />);
        }
      } else if (t === 'meadow') {
        for (let i = 0; i < 2; i++) {
          const fx = r(50 + i);
          const fy = r(60 + i);
          const [px, py] = at(x, y, fx, fy);
          push(fx, fy, <Tuft key={`mt${x},${y},${i}`} x={px} y={py} scale={1.15} dark="#2f6a39" light="#7fd07a" sway delay={delay} />);
        }
        const flowers = 4 + (hash(x, y, 2) % 3);
        for (let i = 0; i < flowers; i++) {
          const fx = r(70 + i);
          const fy = r(80 + i);
          const [px, py] = at(x, y, fx, fy);
          push(fx, fy, (
            <Flower
              key={`mf${x},${y},${i}`}
              x={px}
              y={py}
              color={MEADOW_COLORS[hash(x, y, 90 + i) % MEADOW_COLORS.length]}
              tall={8 + (hash(x, y, 95 + i) % 7)}
              sway={sway(100 + i)}
              delay={delay + i * 0.4}
            />
          ));
        }
      } else if (t === 'dirt') {
        const count = 2 + (hash(x, y, 3) % 3);
        for (let i = 0; i < count; i++) {
          const fx = r(110 + i);
          const fy = r(120 + i);
          const [px, py] = at(x, y, fx, fy);
          push(fx, fy, <Pebble key={`dp${x},${y},${i}`} x={px} y={py} r={1.8 + (hash(x, y, 130 + i) % 3)} />);
        }
        if (hash(x, y, 140) % 4 === 0) {
          const [px, py] = at(x, y, r(141), r(142));
          push(r(141), r(142), <Tuft key={`dt${x},${y}`} x={px} y={py} scale={0.85} dark="#7a6a3a" light="#b5a160" sway={false} delay={0} />);
        }
      } else if (t === 'sand') {
        if (hash(x, y, 150) % 2 === 0) {
          const [px, py] = at(x, y, r(151), r(152));
          push(r(151), r(152), <Shell key={`ss${x},${y}`} x={px} y={py} color={hash(x, y, 153) % 2 ? '#ffd1c2' : '#fff4e0'} />);
        }
        const [qx, qy] = at(x, y, r(154), r(155));
        push(r(154), r(155), <Pebble key={`sp${x},${y}`} x={qx} y={qy} r={1.6} />);
      } else if (t === 'snow') {
        const count = 1 + (hash(x, y, 4) % 2);
        for (let i = 0; i < count; i++) {
          const fx = r(160 + i);
          const fy = r(170 + i);
          const [px, py] = at(x, y, fx, fy);
          push(fx, fy, <SnowMound key={`sm${x},${y},${i}`} x={px} y={py} r={5 + (hash(x, y, 180 + i) % 5)} />);
        }
      } else if (t === 'water') {
        // Reeds along banks that touch land.
        const banks: Array<[number, number, number, number]> = [
          [0, -1, 50, 12],
          [-1, 0, 12, 50],
          [1, 0, 88, 50],
          [0, 1, 50, 88]
        ];
        banks.forEach(([dx, dy, fx, fy], i) => {
          const n = terrainAt(x + dx, y + dy);
          if (!n || n === 'water' || hash(x, y, 190 + i) % 2) return;
          const ox = dx === 0 ? (hash(x, y, 195 + i) % 50) - 25 : 0;
          const oy = dy === 0 ? (hash(x, y, 197 + i) % 50) - 25 : 0;
          const [px, py] = at(x, y, fx + ox, fy + oy);
          push(fx + ox, fy + oy, <Reeds key={`wr${x},${y},${i}`} x={px} y={py} sway delay={delay + i * 0.5} />);
        });
      }

      // Turf overhang: grass blades along edges that drop to lower ground.
      if (TERRAIN_RANK[t] === 3 && t !== 'snow') {
        const edges: Array<[number, number, (k: number) => [number, number]]> = [
          [0, 1, (k) => [k, 96]],
          [1, 0, (k) => [96, k]],
          [0, -1, (k) => [k, 4]],
          [-1, 0, (k) => [4, k]]
        ];
        edges.forEach(([dx, dy, place], e) => {
          const n = terrainAt(x + dx, y + dy);
          if (!n || (TERRAIN_RANK[n] ?? 3) >= 3) return;
          [22, 50, 78].forEach((k, j) => {
            const [fx, fy] = place(k + (hash(x, y, 200 + e * 3 + j) % 14) - 7);
            const [px, py] = at(x, y, fx, fy);
            push(fx, fy, <Tuft key={`ov${x},${y},${e},${j}`} x={px} y={py} scale={0.9} dark="#2a5f33" light="#5fae5c" sway={false} delay={0} />);
          });
        });
      }
    }
  }
  items.sort((p, q) => p.depth - q.depth);
  return (
    <g className="base-ground-detail" pointerEvents="none">
      {items.map((it) => it.node)}
    </g>
  );
}

export const GroundDetail = memo(GroundDetailInner);

/**
 * Soft shadows (and foam on water) along edges where lower ground meets
 * higher ground. Drawn flat in world units inside the tilted ground layer.
 */
export function GroundEdges({ state }: { state: GameState }) {
  const { min, max } = buildableBounds(state.landLevel);
  const terrainAt = (x: number, y: number) =>
    x < min || x > max || y < min || y > max ? null : state.terrain?.[`${x},${y}`] ?? 'grass';
  const strips: ReactNode[] = [];
  for (let y = min; y <= max; y++) {
    for (let x = min; x <= max; x++) {
      const t = terrainAt(x, y)!;
      const rank = TERRAIN_RANK[t] ?? 3;
      const sides: Array<[number, number, string, number, number, number, number]> = [
        [0, -1, 'n', x * 100, y * 100, 100, 12],
        [0, 1, 's', x * 100, y * 100 + 88, 100, 12],
        [-1, 0, 'w', x * 100, y * 100, 12, 100],
        [1, 0, 'e', x * 100 + 88, y * 100, 12, 100]
      ];
      for (const [dx, dy, dir, rx, ry, rw, rh] of sides) {
        const n = terrainAt(x + dx, y + dy);
        if (!n) continue;
        const nRank = TERRAIN_RANK[n] ?? 3;
        if (nRank <= rank) continue;
        strips.push(<rect key={`${x},${y},${dir}`} x={rx} y={ry} width={rw} height={rh} fill={`url(#edge-${dir})`} />);
        if (t === 'water') {
          const fx = dir === 'e' ? rx + 9 : rx;
          const fy = dir === 's' ? ry + 9 : ry;
          strips.push(
            <rect key={`f${x},${y},${dir}`} x={fx} y={fy} width={dir === 'n' || dir === 's' ? 100 : 3} height={dir === 'n' || dir === 's' ? 3 : 100} fill="#c9f1ff" opacity={0.45} />
          );
        }
      }
    }
  }
  return (
    <g pointerEvents="none">
      <defs>
        {(['n', 's', 'w', 'e'] as const).map((dir) => (
          <linearGradient
            key={dir}
            id={`edge-${dir}`}
            x1={dir === 'e' ? 1 : 0}
            y1={dir === 's' ? 1 : 0}
            x2={dir === 'w' ? 1 : 0}
            y2={dir === 'n' ? 1 : 0}>
            <stop offset="0" stopColor="#000" stopOpacity="0.38" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {strips}
    </g>
  );
}
