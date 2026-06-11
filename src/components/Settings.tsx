import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import { useAuth } from '../context/AuthContext';
import type { DailySetGoal } from '../hooks/useDailySetGoal';

interface SettingsProps {
  coins: number;
  dailySetGoal: DailySetGoal;
  isDark: boolean;
  onDailySetGoalChange: (goal: DailySetGoal) => void;
  onToggleDark: () => void;
  onBack: () => void;
}

export function Settings({
  coins,
  dailySetGoal,
  isDark,
  onDailySetGoalChange,
  onToggleDark,
  onBack
}: SettingsProps) {
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="cyber-icon-btn cyber-icon-btn--back"
          aria-label="Back">
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl md:text-3xl tracking-tighter store-title-glow text-[#00B2FF]">
          SETTINGS
        </h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="space-y-6">
        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">daily set target</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            How many sets you aim to hit per exercise each day.
          </p>
          <div className="flex gap-2">
            {([2, 3] as const).map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => onDailySetGoalChange(goal)}
                className={`store-btn flex-1 justify-center ${
                  dailySetGoal === goal
                    ? 'store-btn--active'
                    : 'store-btn--equip'
                }`}>
                {goal} sets
              </button>
            ))}
          </div>
        </section>

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">appearance</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            {isDark ? 'night mode on' : 'day mode on'}
          </p>
          <button
            type="button"
            onClick={onToggleDark}
            className="settings-action-btn settings-action-btn--theme">
            {isDark ? (
              <>
                <Sun size={18} strokeWidth={2.5} />
                switch to day mode
              </>
            ) : (
              <>
                <Moon size={18} strokeWidth={2.5} />
                switch to night mode
              </>
            )}
          </button>
        </section>

        <section className="cyber-panel p-5 normal-case">
          <h2 className="settings-section-title">account</h2>
          <p className="text-sm font-medium opacity-70 mb-4">
            Leave the suffering. For now.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="settings-action-btn settings-action-btn--signout">
            <LogOut size={18} strokeWidth={2.5} />
            sign out
          </button>
        </section>
      </div>
    </div>
  );
}
