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
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="bg-white dark:bg-[#2a2a2a] dark:text-white border-4 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all"
          aria-label="Back">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-3xl tracking-tighter">SETTINGS</h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="space-y-6">
        <section className="bg-white dark:bg-[#2a2a2a] border-4 border-black dark:border-white p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold mb-1 normal-case">daily set target</h2>
          <p className="text-sm font-medium text-black/60 dark:text-white/60 mb-4 normal-case">
            How many sets you aim to hit per exercise each day.
          </p>
          <div className="flex gap-2">
            {([2, 3] as const).map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => onDailySetGoalChange(goal)}
                className={`flex-1 py-3 font-bold text-sm border-2 border-black dark:border-white transition-all brutal-shadow-hover ${
                  dailySetGoal === goal
                    ? 'bg-[#00FF00] text-black'
                    : 'bg-white dark:bg-[#1a1a1a] dark:text-white text-black/70'
                }`}>
                {goal} sets
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-[#2a2a2a] border-4 border-black dark:border-white p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold mb-1 normal-case">appearance</h2>
          <p className="text-sm font-medium text-black/60 dark:text-white/60 mb-4 normal-case">
            {isDark ? 'night mode on' : 'day mode on'}
          </p>
          <button
            type="button"
            onClick={onToggleDark}
            className="w-full bg-black text-white dark:bg-[#f4f4f0] dark:text-black border-2 border-black dark:border-white py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 brutal-shadow-hover transition-all">
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

        <section className="bg-white dark:bg-[#2a2a2a] border-4 border-black dark:border-white p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold mb-1 normal-case">account</h2>
          <p className="text-sm font-medium text-black/60 dark:text-white/60 mb-4 normal-case">
            Leave the suffering. For now.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full bg-[#FF4D00] text-black border-2 border-black dark:border-white py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 brutal-shadow-hover transition-all">
            <LogOut size={18} strokeWidth={2.5} />
            sign out
          </button>
        </section>
      </div>
    </div>
  );
}
