import { Loader2 } from 'lucide-react';
import type { ResourceId } from '../game/catalog';
import { ResourceIcon } from './game/ResourceIcon';

/**
 * Resource icons drawn in the base's own isometric style (lit top, shaded
 * sides), so the HUD matches the world it counts for.
 */
export function HudIcon({ id, size = 18 }: { id: ResourceId | 'coins'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className="hud-icon">
      {id === 'stone' && (
        <g>
          <polygon points="10,2.5 17,6 10,9.5 3,6" fill="#d9dee6" />
          <polygon points="3,6 10,9.5 10,17.5 3,14" fill="#a7afbb" />
          <polygon points="17,6 10,9.5 10,17.5 17,14" fill="#7d8592" />
          <polyline points="3,6 10,9.5 17,6" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.8" />
        </g>
      )}
      {id === 'timber' && (
        <g>
          {[
            [3.5, 11.5],
            [9.5, 14.5],
            [6.5, 6.5]
          ].map(([x, y], i) => (
            <g key={i}>
              <path d={`M${x} ${y} l7 -3.5 l0 4 l-7 3.5 Z`} fill={i === 2 ? '#c48a4c' : '#a8743d'} />
              <ellipse cx={x + 7} cy={y - 1.5} rx="1.7" ry="2.1" fill="#e7c08a" stroke="#8a5a2b" strokeWidth="0.6" />
            </g>
          ))}
        </g>
      )}
      {id === 'crystal' && (
        <g>
          <polygon points="10,1.5 15.5,7 10,18.5 4.5,7" fill="#a98bff" />
          <polygon points="10,1.5 15.5,7 10,8.5" fill="#d8ccff" />
          <polygon points="10,1.5 4.5,7 10,8.5" fill="#c2b0ff" />
          <polygon points="10,8.5 15.5,7 10,18.5" fill="#7a5ce0" />
        </g>
      )}
      {id === 'coins' && (
        <g>
          <ellipse cx="10" cy="12.5" rx="7.5" ry="4.5" fill="#b8860b" />
          <rect x="2.5" y="9.5" width="15" height="3" fill="#b8860b" />
          <ellipse cx="10" cy="9.5" rx="7.5" ry="4.5" fill="#f7c948" />
          <ellipse cx="10" cy="9.5" rx="4.6" ry="2.6" fill="none" stroke="#b8860b" strokeWidth="1" />
          <path d="M6 8 q2 -2.4 5 -2.2" fill="none" stroke="#fff6c8" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/** One game-style resource bar: stone · timber · crystal · coins. */
export function HudStrip({
  materials,
  coins,
  coinsLoading,
  label
}: {
  materials: Record<ResourceId, number>;
  coins: number;
  coinsLoading: boolean;
  label: string;
}) {
  return (
    <div className="hud-strip" role="group" aria-label={label}>
      {(['stone', 'timber', 'crystal'] as const).map((id) => (
        <span key={id} className="hud-cell">
          <ResourceIcon id={id} size={18} />
          <span className="hud-n tabular-nums">{materials[id]}</span>
        </span>
      ))}
      <span className="hud-cell hud-coins" data-tour="coins">
        <HudIcon id="coins" />
        {coinsLoading ? <Loader2 size={14} className="animate-spin" /> : <span className="hud-n tabular-nums">{coins}</span>}
      </span>
    </div>
  );
}
