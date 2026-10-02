import { memo, type ReactNode } from 'react';

/**
 * The cut-away sides of the floating plot: topsoil with roots, a brown middle
 * layer and darker bedrock, studded with stones, crystal and gold ores, and
 * little water pockets that drip from the bottom edge. Placed by a fixed hash
 * so it never reshuffles, and scales with the plot.
 */

type Pt = [number, number];

function hash(n: number, salt: number): number {
  let h = (n * 2654435761 + salt * 2246822519) >>> 0;
  h = ((h ^ (h >>> 15)) * 2246822519) >>> 0;
  return (h ^ (h >>> 13)) >>> 0;
}

function SlabSidesInner({ L, B, R, depth, span }: { L: Pt; B: Pt; R: Pt; depth: number; span: number }) {
  // A point on a face: u along the top edge (0..1), v down the depth (0..1).
  const onLeft = (u: number, v: number): Pt => [L[0] + (B[0] - L[0]) * u, L[1] + (B[1] - L[1]) * u + depth * v];
  const onRight = (u: number, v: number): Pt => [B[0] + (R[0] - B[0]) * u, B[1] + (R[1] - B[1]) * u + depth * v];
  const band = (face: (u: number, v: number) => Pt, v0: number, v1: number) =>
    [face(0, v0), face(1, v0), face(1, v1), face(0, v1)].map(([x, y]) => `${x},${y}`).join(' ');

  const details: ReactNode[] = [];
  const perFace = Math.round(span / 26);
  (['left', 'right'] as const).forEach((side, f) => {
    const face = side === 'left' ? onLeft : onRight;
    const shade = side === 'left' ? 1 : 0.78;
    for (let i = 0; i < perFace; i++) {
      const h = hash(i + 1, f * 97 + 3);
      const u = (i + 0.2 + ((h % 60) / 100)) / perFace;
      if (u > 0.97) continue;
      const kind = h % 11;
      const v = 0.18 + ((h >>> 8) % 70) / 100;
      const [x, y] = face(u, Math.min(0.9, v));
      const key = `${side}${i}`;
      if (kind <= 4) {
        // Embedded stone
        const r = 5 + ((h >>> 4) % 7);
        details.push(
          <g key={key}>
            <ellipse cx={x} cy={y + r * 0.35} rx={r * 1.1} ry={r * 0.55} fill="#000" opacity={0.25} />
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.68} fill={`rgb(${Math.round(150 * shade)},${Math.round(140 * shade)},${Math.round(128 * shade)})`} />
            <ellipse cx={x - r * 0.3} cy={y - r * 0.25} rx={r * 0.45} ry={r * 0.22} fill="#d6ccbe" opacity={0.6 * shade} />
          </g>
        );
      } else if (kind <= 6) {
        // Crystal ore: a little cluster of faceted shards
        const c = kind === 5 ? ['#c9b8ff', '#8f6ff0', '#553db0'] : ['#a8f0ff', '#37c8e8', '#1a7799'];
        details.push(
          <g key={key}>
            <ellipse cx={x + 1} cy={y + 1.5} rx={9} ry={4} fill="#2a1a0e" opacity={0.35} />
            {[
              [-5, 1.5, 8],
              [1.5, 0, 11],
              [6.5, 2.5, 7]
            ].map(([dx, dy, hgt], j) => (
              <g key={j}>
                <polygon points={`${x + dx - 2.6},${y + dy} ${x + dx},${y + dy - hgt} ${x + dx + 2.6},${y + dy}`} fill={c[1]} />
                <polygon points={`${x + dx},${y + dy - hgt} ${x + dx + 2.6},${y + dy} ${x + dx + 0.5},${y + dy}`} fill={c[2]} />
                <polygon points={`${x + dx - 2.6},${y + dy} ${x + dx},${y + dy - hgt} ${x + dx - 0.6},${y + dy}`} fill={c[0]} opacity={0.85} />
              </g>
            ))}
            {h % 2 === 0 && (
              <circle cx={x + 1.5} cy={y - 10} r={1.8} fill="#ffffff" className="base-sparkle" style={{ animationDelay: `${(h % 30) / 10}s` }} />
            )}
          </g>
        );
      } else if (kind <= 8) {
        // Gold flecks
        details.push(
          <g key={key}>
            {[
              [0, 0, 2.6],
              [5, 2, 1.8],
              [-4, 3, 2],
              [1.5, 5.5, 1.5],
              [-1, -3.5, 1.3]
            ].map(([dx, dy, r], j) => (
              <circle key={j} cx={x + dx} cy={y + dy} r={r} fill={j === 0 ? '#ffe27a' : '#f7c948'} />
            ))}
            {h % 3 === 0 && <circle cx={x} cy={y} r={1} fill="#fff" className="base-sparkle" style={{ animationDelay: `${(h % 40) / 10}s` }} />}
          </g>
        );
      } else {
        // Water pocket, sometimes seeping down to a drip
        const w = 9 + ((h >>> 5) % 7);
        details.push(
          <g key={key}>
            <ellipse cx={x} cy={y} rx={w} ry={w * 0.42} fill="#1d4f70" />
            <ellipse cx={x} cy={y + 0.6} rx={w - 1.4} ry={w * 0.42 - 1.2} fill="#3a8fc0" />
            <ellipse cx={x - w * 0.3} cy={y - 0.4} rx={w * 0.35} ry={w * 0.12} fill="#c9f1ff" opacity={0.8} />
          </g>
        );
        if (h % 2 === 0) {
          const [dx, dy] = face(u, 1);
          details.push(
            <g key={`${key}-drip`} className="slab-drip" style={{ animationDelay: `${(h % 50) / 10}s` }}>
              <path d={`M${dx} ${dy} q-1.6 3 0 4.4 q1.6 -1.4 0 -4.4 Z`} fill="#6cc7ee" />
            </g>
          );
        }
      }
    }
    // Roots hanging down from the turf
    const roots = Math.round(perFace * 0.7);
    for (let i = 0; i < roots; i++) {
      const h = hash(i + 50, f * 31 + 7);
      const u = (i + 0.5) / roots;
      const [x, y] = face(u, 0.12);
      const len = 8 + (h % 12);
      details.push(
        <path
          key={`root-${side}${i}`}
          d={`M${x} ${y} q${(h % 5) - 2} ${len / 2} ${(h % 7) - 3} ${len}`}
          stroke="#4a2f1a"
          strokeWidth={1.5}
          fill="none"
          opacity={0.75}
        />
      );
    }
  });

  return (
    <g pointerEvents="none">
      {/* Bedrock at the bottom */}
      <polygon points={band(onLeft, 0.7, 1)} fill="#4d4540" />
      <polygon points={band(onRight, 0.7, 1)} fill="#3a332e" />
      <polygon points={band(onLeft, 0.7, 0.74)} fill="#2a1a0e" opacity={0.35} />
      <polygon points={band(onRight, 0.7, 0.74)} fill="#2a1a0e" opacity={0.35} />
      {/* Topsoil darker band */}
      <polygon points={band(onLeft, 0.1, 0.24)} fill="#5a3a22" opacity={0.45} />
      <polygon points={band(onRight, 0.1, 0.24)} fill="#3f2816" opacity={0.45} />
      {/* Strata lines */}
      {[0.24, 0.47, 0.7].map((v) => (
        <g key={v} stroke="#2a1a0e" strokeOpacity={0.35} strokeWidth={1.1} fill="none">
          <polyline points={[onLeft(0, v), onLeft(1, v), onRight(1, v)].map(([x, y]) => `${x},${y}`).join(' ')} />
        </g>
      ))}
      {details}
    </g>
  );
}

export const SlabSides = memo(SlabSidesInner);
