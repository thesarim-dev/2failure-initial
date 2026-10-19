import { useCountFrom } from '../lib/motion';
import { Coins } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CoinsBadgeProps {
  coins: number;
}

export function CoinsBadge({ coins }: CoinsBadgeProps) {
  const { t } = useLanguage();
  // Coins count up to the new total, with a little bump while they do.
  const [shown, changing] = useCountFrom(coins, 700, 'wallet-coins');

  return (
    <div
      className={`coins-badge flex items-center gap-2 px-4 py-2 ${changing ? 'is-counting' : ''}`}
      title={t.coins.title}>
      <Coins size={20} strokeWidth={2.5} aria-hidden="true" />
      <span className="font-bold tabular-nums">{shown}</span>
    </div>
  );
}
