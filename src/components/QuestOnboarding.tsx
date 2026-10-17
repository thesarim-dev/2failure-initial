import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Castle, Dumbbell, Flame, Gem, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { storageKeyFor } from '../lib/persistedSettings';
import { fx } from '../lib/feedback';

/**
 * The onboarding quest: a friendly, hands-on first session.
 *   welcome → see your base → tap Build → pick the (free) Lodge → place it →
 *   go to Train → do your first set to failure → the set finishes the Lodge →
 *   go see it → celebrate.
 * Each step spotlights what to tap and moves on when the player actually does
 * it. Nothing is blocked, and Skip is always there.
 */

export type QuestStage =
  | 'welcome'
  | 'base'
  | 'build'
  | 'pick'
  | 'choose'
  | 'place'
  | 'train'
  | 'pushups'
  | 'workout'
  | 'receipt'
  | 'celebrate'
  | 'done';

const KEY = 'quest-stage';

export function readQuestStage(userId: string | undefined): QuestStage {
  if (!userId) return 'done';
  try {
    return (window.localStorage.getItem(storageKeyFor(userId, KEY)) as QuestStage | null) ?? 'welcome';
  } catch {
    return 'welcome';
  }
}

function useTargetRect(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const scrolled = useRef<string | null>(null);
  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const tick = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      if (scrolled.current !== selector) {
        scrolled.current = selector;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      const r = el.getBoundingClientRect();
      setRect((prev) =>
        prev && Math.abs(prev.top - r.top) < 1 && Math.abs(prev.left - r.left) < 1 && Math.abs(prev.width - r.width) < 1 ? prev : r
      );
    };
    tick();
    const id = window.setInterval(tick, 180);
    return () => window.clearInterval(id);
  }, [selector]);
  return rect;
}

export function QuestOnboarding({
  userId,
  appState,
  hasConstruction,
  firstExerciseName,
  onGoBase,
  onStartFirstSet,
  onDone
}: {
  userId: string;
  appState: string;
  /** Something is being built (the Lodge was placed). */
  hasConstruction: boolean;
  firstExerciseName: string;
  onGoBase: () => void;
  onStartFirstSet: () => void;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const q = t.hub.quest;
  const [stage, setStageState] = useState<QuestStage>(() => readQuestStage(userId));
  const [dom, setDom] = useState(0); // re-render tick to re-check the page

  const setStage = (next: QuestStage) => {
    setStageState(next);
    try {
      window.localStorage.setItem(storageKeyFor(userId, KEY), next);
    } catch {
      // Ignore storage failures.
    }
  };

  // Watch the page so steps advance when the player does the thing.
  useEffect(() => {
    const id = window.setInterval(() => setDom((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const has = (sel: string) => !!document.querySelector(sel);
    if (stage === 'build' && has('.base-catalog-item')) setStage('pick');
    else if (stage === 'pick' && !has('.base-catalog-item')) setStage(has('[data-quest="choose-spot"]') ? 'choose' : 'place');
    else if (stage === 'choose' && !has('[data-quest="choose-spot"]')) setStage('place');
    else if ((stage === 'pick' || stage === 'choose' || stage === 'place') && hasConstruction) setStage('train');
    else if (stage === 'train' && appState === 'HOME') setStage('pushups');
    else if (stage === 'pushups' && appState !== 'HOME' && appState !== 'BASE' && appState !== 'SETTINGS' && appState !== 'STORE') {
      onStartFirstSet();
      setStage('workout');
    } else if (stage === 'workout' && appState === 'SUMMARY') setStage('receipt');
    else if (stage === 'receipt' && appState === 'BASE') setStage('celebrate');
    else if (stage === 'base' && appState !== 'BASE') onGoBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dom, stage, appState, hasConstruction]);

  const finish = () => {
    setStage('done');
    onDone();
  };

  const step: { target: string | null; text: string; next?: boolean } | null =
    stage === 'base'
      ? { target: '.base-board-wrap', text: q.base, next: true }
      : stage === 'build'
        ? { target: '.map-build-btn', text: q.build }
        : stage === 'pick'
          ? { target: '.base-catalog-item[data-item="lodge"]', text: q.pick }
          : stage === 'choose'
            ? { target: '[data-quest="choose-spot"]', text: q.choose }
            : stage === 'place'
              ? { target: '.base-board-wrap', text: q.place }
              : stage === 'train'
                ? { target: '[data-tour="train-tab"]', text: q.train }
                : stage === 'pushups'
                  ? { target: '[data-tour="move"]', text: q.pushups(firstExerciseName) }
                  : stage === 'receipt'
                    ? { target: '.summary-base-link', text: q.receipt }
                    : null;
  const rect = useTargetRect(step?.target ?? null);

  if (stage === 'done' || stage === 'workout') return null;

  if (stage === 'welcome') {
    const icons = [Dumbbell, Gem, Castle];
    return (
      <div className="quest-modal" role="dialog" aria-modal="true" aria-labelledby="quest-welcome-title">
        <motion.div className="quest-modal-card" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
          <h1 id="quest-welcome-title" className="quest-modal-title">
            {q.welcomeTitle}
          </h1>
          <p className="quest-modal-sub">{q.welcomeSub}</p>
          <ol className="quest-loop">
            {q.loop.map((label, i) => {
              const Icon = icons[i];
              return (
                <motion.li key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.12 }}>
                  <span className={`quest-loop-icon is-${i}`} aria-hidden="true">
                    <Icon size={22} strokeWidth={2.5} />
                  </span>
                  <span className="quest-loop-text">
                    <span className="quest-loop-label">{label}</span>
                    <span className="quest-loop-sub">{q.loopSub[i]}</span>
                  </span>
                </motion.li>
              );
            })}
          </ol>
          <button
            type="button"
            className="quest-primary"
            onClick={() => {
              fx.confirm();
              onGoBase();
              setStage('base');
            }}>
            {q.start}
          </button>
          <button type="button" className="quest-skip" onClick={finish}>
            {q.skip}
          </button>
        </motion.div>
      </div>
    );
  }

  if (stage === 'celebrate') {
    const tipIcons = [Flame, Target, Sparkles, SlidersHorizontal];
    return (
      <div className="quest-modal" role="dialog" aria-modal="true" aria-labelledby="quest-done-title">
        <motion.div className="quest-modal-card is-celebrate" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="quest-confetti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.12}s` }} />
            ))}
          </div>
          <h1 id="quest-done-title" className="quest-modal-title">
            {q.celebrateTitle}
          </h1>
          <p className="quest-modal-sub">{q.celebrateSub}</p>
          <ul className="quest-tips">
            {q.tips.map((tip, i) => {
              const Icon = tipIcons[i];
              return (
                <li key={i}>
                  <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="quest-primary"
            onClick={() => {
              fx.levelUp();
              finish();
            }}>
            {q.done}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!step) return null;
  const pad = 8;
  const below = rect ? rect.bottom + 190 < window.innerHeight : true;
  return (
    <div className="quest-layer" aria-live="polite">
      {rect && (
        <div
          className="quest-spot"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          className="quest-bubble"
          style={
            rect
              ? below
                ? { top: Math.min(rect.bottom + pad + 12, window.innerHeight - 200) }
                : { bottom: Math.max(window.innerHeight - rect.top + pad + 12, 16) }
              : { bottom: 96 }
          }
          initial={{ opacity: 0, y: below ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}>
          <p className="quest-bubble-text">{step.text}</p>
          <div className="quest-bubble-actions">
            <button type="button" className="quest-skip" onClick={finish}>
              {q.skip}
            </button>
            {step.next && (
              <button type="button" className="quest-next" onClick={() => setStage('build')}>
                {q.next}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
