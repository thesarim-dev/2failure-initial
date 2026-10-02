import { memo, type ReactNode } from 'react';

/**
 * The cut-away sides of the floating plot, drawn like a soil profile:
 * a grassy lip, topsoil with lighter patches and dark spots, smooth subsoil,
 * a darker layer of small pebbles and gravelly bedrock at the bottom. Layer
 * boundaries wave naturally. Placement is a fixed hash, so it never
 * reshuffles, and it scales with the plot.
 */

type Pt = [number, number];

function hash(n: number, salt: number): number {
  let h = (n * 2654435761 + salt * 2246822519) >>> 0;
  h = ((h ^ (h >>> 15)) * 2246822519) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}
const rand = (n: number, salt: number) => (hash(n, salt) % 10000) / 10000;

function darken(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.round(((n >> s) & 255) * k);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// Layers top to bottom: colour, mean depth of the bottom edge, wave size.
const LAYERS: Array<{ color: string; bottom: number; wave: number }> = [
  { color: '#a8663a', bottom: 0.34, wave: 0.05 }, // topsoil
  { color: '#94502c', bottom: 0.56, wave: 0.05 }, // subsoil
  { color: '#77401f', bottom: 0.76, wave: 0.06 }, // pebble layer
  { color: '#3d2416', bottom: 1, wave: 0 } // bedrock
];

function SlabSidesInner({ L, B, R, depth, span }: { L: Pt; B: Pt; R: Pt; depth: number; span: number }) {
  const faces = [
    { key: 'left', at: (u: number, v: number): Pt => [L[0] + (B[0] - L[0]) * u, L[1] + (B[1] - L[1]) * u + depth * v], shade: 1, salt: 11 },
    { key: 'right', at: (u: number, v: number): Pt => [B[0] + (R[0] - B[0]) * u, B[1] + (R[1] - B[1]) * u + depth * v], shade: 0.8, salt: 29 }
  ];
  const samples = Math.max(24, Math.round(span / 12));
  const out: ReactNode[] = [];

  faces.forEach((face) => {
    // A wavy boundary: a few sine waves with fixed random phases.
    const boundary = (layer: number) => (u: number) => {
      const { bottom, wave } = LAYERS[layer];
      if (!wave) return bottom;
      const p = face.salt * 7 + layer * 13;
      const w =
        Math.sin(u * 9 + rand(p, 1) * 6) * 0.55 +
        Math.sin(u * 23 + rand(p, 2) * 6) * 0.3 +
        Math.sin(u * 47 + rand(p, 3) * 6) * 0.15;
      return Math.min(0.98, bottom + w * wave);
    };
    const line = (fn: (u: number) => number) => Array.from({ length: samples + 1 }, (_, i) => face.at(i / samples, fn(i / samples)));
    const toPts = (pts: Pt[]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    // Layer bands
    let top = (u: number) => 0 * u;
    LAYERS.forEach((layer, i) => {
      const bottom = boundary(i);
      const upper = line(top);
      const lower = line(bottom).reverse();
      out.push(<polygon key={`${face.key}-band${i}`} points={toPts([...upper, ...lower])} fill={darken(layer.color, face.shade)} />);
      top = bottom;
    });

    // Topsoil: lighter tan patches and darker organic spots.
    const patches = Math.round(samples * 0.55);
    for (let i = 0; i < patches; i++) {
      const u = (i + rand(i, face.salt + 40)) / patches;
      const v = 0.12 + rand(i, face.salt + 41) * 0.15;
      const [x, y] = face.at(Math.min(0.98, u), v);
      const r = 4 + rand(i, face.salt + 42) * 5;
      out.push(
        <g key={`${face.key}-patch${i}`} fill={darken('#c99a5e', face.shade)}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.7} />
          <ellipse cx={x + r * 0.7} cy={y + r * 0.35} rx={r * 0.6} ry={r * 0.5} />
          <ellipse cx={x - r * 0.6} cy={y + r * 0.45} rx={r * 0.5} ry={r * 0.45} />
        </g>
      );
      if (i % 2 === 0) {
        const [sx, sy] = face.at(Math.min(0.98, u + 0.02), v + 0.06);
        out.push(
          <path
            key={`${face.key}-spot${i}`}
            d={`M${sx} ${sy} q${3 + rand(i, 50) * 3} -${2 + rand(i, 51) * 3} 5 1 q-1 4 -4 3 q-3 0 -1 -4 Z`}
            fill={darken('#5e3018', face.shade)}
          />
        );
      }
    }

    // Pebble layer: small angular stones.
    const pebbles = Math.round(samples * 0.9);
    for (let i = 0; i < pebbles; i++) {
      const u = (i + rand(i, face.salt + 60)) / pebbles;
      const v = 0.6 + rand(i, face.salt + 61) * 0.14;
      const [x, y] = face.at(Math.min(0.98, u), v);
      const s = 1.8 + rand(i, face.salt + 62) * 2.6;
      out.push(
        <polygon
          key={`${face.key}-peb${i}`}
          points={`${x - s},${y} ${x - s * 0.3},${y - s * 0.8} ${x + s},${y - s * 0.4} ${x + s * 0.7},${y + s * 0.6} ${x - s * 0.4},${y + s * 0.7}`}
          fill={darken('#5a2d16', face.shade)}
        />
      );
    }

    // Bedrock: packed grey and white angular rocks.
    const rocks = Math.round(samples * 1.5);
    const greys = ['#d8d3cc', '#a9a29a', '#7b746d', '#5a5450', '#c4beb7'];
    for (let i = 0; i < rocks; i++) {
      const u = (i + rand(i, face.salt + 70)) / rocks;
      const v = 0.82 + rand(i, face.salt + 71) * 0.15;
      const [x, y] = face.at(Math.min(0.99, u), v);
      const s = 2 + rand(i, face.salt + 72) * 3.4;
      const c = greys[hash(i, face.salt + 73) % greys.length];
      out.push(
        <g key={`${face.key}-rock${i}`}>
          <polygon
            points={`${x - s},${y + s * 0.3} ${x - s * 0.6},${y - s * 0.7} ${x + s * 0.5},${y - s * 0.8} ${x + s},${y + s * 0.1} ${x + s * 0.4},${y + s * 0.7} ${x - s * 0.5},${y + s * 0.65}`}
            fill={darken(c, face.shade)}
          />
          <polygon points={`${x - s * 0.6},${y - s * 0.7} ${x + s * 0.5},${y - s * 0.8} ${x + s * 0.1},${y - s * 0.2}`} fill="#ffffff" opacity={0.18} />
        </g>
      );
    }

    // A few crystal clusters and gold flecks in the deep layers, for a bit of treasure.
    const ores = Math.max(2, Math.round(span / 300));
    for (let i = 0; i < ores; i++) {
      const u = (i + 0.3 + rand(i, face.salt + 80) * 0.4) / ores;
      const [x, y] = face.at(u, 0.66 + rand(i, face.salt + 81) * 0.1);
      if (i % 2 === 0) {
        const c = rand(i, face.salt + 82) > 0.5 ? ['#c9b8ff', '#8f6ff0'] : ['#a8f0ff', '#37c8e8'];
        out.push(
          <g key={`${face.key}-ore${i}`}>
            {[
              [-4, 1, 7],
              [1, 0, 10],
              [5, 2, 6]
            ].map(([dx, dy, h], j) => (
              <g key={j}>
                <polygon points={`${x + dx - 2.2},${y + dy} ${x + dx},${y + dy - h} ${x + dx + 2.2},${y + dy}`} fill={darken(c[1], face.shade)} />
                <polygon points={`${x + dx - 2.2},${y + dy} ${x + dx},${y + dy - h} ${x + dx - 0.4},${y + dy}`} fill={c[0]} opacity={0.8} />
              </g>
            ))}
            <circle cx={x + 1} cy={y - 9} r={1.6} fill="#fff" className="base-sparkle" style={{ animationDelay: `${i * 0.9}s` }} />
          </g>
        );
      } else {
        out.push(
          <g key={`${face.key}-gold${i}`} fill="#f7c948">
            <circle cx={x} cy={y} r={2.2} />
            <circle cx={x + 4} cy={y + 1.6} r={1.5} />
            <circle cx={x - 3.5} cy={y + 2.4} r={1.6} />
          </g>
        );
      }
    }

    // Roots reaching down from the turf.
    const roots = Math.round(samples * 0.35);
    for (let i = 0; i < roots; i++) {
      const u = (i + 0.5) / roots;
      const [x, y] = face.at(u, 0.06);
      const len = depth * (0.1 + rand(i, face.salt + 90) * 0.12);
      const bend = (rand(i, face.salt + 91) - 0.5) * 8;
      out.push(
        <path
          key={`${face.key}-root${i}`}
          d={`M${x} ${y} q${bend} ${len * 0.5} ${bend * 0.3} ${len}`}
          stroke={darken('#4a2a14', face.shade)}
          strokeWidth={1.3}
          fill="none"
          opacity={0.85}
        />
      );
    }

    // Grass lip with blades hanging over the edge.
    const lipTop = line(() => 0);
    const lipBottom = Array.from({ length: samples * 2 + 1 }, (_, i) => {
      const u = i / (samples * 2);
      const hang = i % 2 === 0 ? 0.07 : 0.11 + rand(i, face.salt + 95) * 0.06;
      return face.at(u, hang);
    }).reverse();
    out.push(<polygon key={`${face.key}-lip`} points={toPts([...lipTop, ...lipBottom])} fill={darken('#3a8a3e', face.shade)} />);
    out.push(
      <polyline key={`${face.key}-lipline`} points={toPts(line(() => 0.035))} fill="none" stroke={darken('#5fb35a', face.shade)} strokeWidth={1.4} opacity={0.6} />
    );
  });

  return <g pointerEvents="none">{out}</g>;
}

export const SlabSides = memo(SlabSidesInner);
