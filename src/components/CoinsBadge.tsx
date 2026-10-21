import { Coins } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CoinsBadgeProps {
  coins: number;
}

export function CoinsBadge({ coins }: CoinsBadgeProps) {
  const { t } = useLanguage();

  return (
    <div
      className="coins-badge flex items-center gap-2 px-4 py-2"
      title={t.coins.title}>
      <Coins size={20} strokeWidth={2.5} aria-hidden="true" />
      <span className="font-bold tabular-nums">{coins}</span>
    </div>
  );
}
