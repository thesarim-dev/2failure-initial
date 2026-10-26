import { HudIcon } from './HudStrip';
import { useLanguage } from '../context/LanguageContext';

interface CoinsBadgeProps {
  coins: number;
}

export function CoinsBadge({ coins }: CoinsBadgeProps) {
  const { t } = useLanguage();

  return (
    <div
      className="hud-strip hud-single"
      title={t.coins.title}>
      <span className="hud-cell hud-coins">
        <HudIcon id="coins" />
        <span className="hud-n tabular-nums">{coins}</span>
      </span>
    </div>
  );
}
