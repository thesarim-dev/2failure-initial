/**
 * The streak as a glossy, living flame. Lit (warm, flickering, glowing) once
 * today's streak is protected; a dim ember with a slow flicker until then.
 */
export function StreakFlame({ count, lit, label }: { count: number; lit: boolean; label: string }) {
  return (
    <div className={`streak-flame ${lit ? 'is-lit' : 'is-unlit'}`}>
      <div className="streak-flame-fire">
      <svg viewBox="0 0 80 96" className="streak-flame-svg" aria-hidden="true">
        <defs>
          <linearGradient id="sf-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd43b" />
            <stop offset="0.45" stopColor="#ffa41b" />
            <stop offset="1" stopColor="#ff6a1a" />
          </linearGradient>
          <linearGradient id="sf-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6b0" />
            <stop offset="1" stopColor="#ffc44d" />
          </linearGradient>
          <radialGradient id="sf-shine" cx="0.35" cy="0.35" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sf-glow" cx="0.5" cy="0.6" r="0.5">
            <stop offset="0" stopColor="#ff9a2e" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff9a2e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sf-shadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" stopOpacity="0.35" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="40" cy="90" rx="24" ry="4" fill="url(#sf-shadow)" />
        <circle cx="40" cy="56" r="40" fill="url(#sf-glow)" className="streak-flame-glow" />
        {/* Outer flame: a rounded body with three tongues. */}
        <g className="streak-flame-outer">
          <path
            d="M40 4
               C 46 16, 58 22, 56 36
               C 60 32, 63 26, 64 22
               C 72 34, 74 46, 72 58
               C 69 76, 56 86, 40 86
               C 24 86, 11 76, 8 58
               C 6 46, 10 34, 17 26
               C 18 32, 21 36, 25 38
               C 22 24, 30 12, 40 4 Z"
            fill="url(#sf-outer)"
          />
          <path d="M40 4 C 46 16, 58 22, 56 36 C 48 30, 42 22, 40 4 Z" fill="#ffe27a" opacity="0.55" />
          <ellipse cx="28" cy="50" rx="11" ry="17" fill="url(#sf-shine)" />
        </g>
        {/* Inner flame dances in its own rhythm. */}
        <g className="streak-flame-inner">
          <path
            d="M40 34 C 45 44, 54 50, 53 62 C 52 74, 46 80, 40 80 C 34 80, 27 74, 27 64 C 27 56, 32 52, 34 46 C 36 50, 38 52, 40 52 C 38 46, 37 40, 40 34 Z"
            fill="url(#sf-inner)"
          />
        </g>
      </svg>
      <span className="streak-flame-count tabular-nums">{count}</span>
      </div>
      {/* A little neon sign that switches on with the flame. */}
      <span className="streak-neon">{label}</span>
    </div>
  );
}
