import { useEffect, useState } from 'react';
import { ArrowLeft, Hand } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fx } from '../lib/feedback';
import { cheerFriend, friendBase, type Friend } from '../lib/social';
import { parseSave } from '../game/useBaseGame';
import { baseLevel, type GameState } from '../game/engine';
import { BaseBoard } from './game/BaseBoard';

/** Visiting a friend's base: look around (read-only) and cheer them. */
export function FriendBase({ friend, onBack }: { friend: Friend; onBack: () => void }) {
  const { t } = useLanguage();
  const s = t.social;
  const g = t.game;
  const [state, setState] = useState<GameState | null>(null);
  const [failed, setFailed] = useState(false);
  const [cheered, setCheered] = useState(friend.cheeredToday);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void friendBase(friend.id).then((raw) => {
      if (raw === null) setFailed(true);
      else setState(parseSave(raw));
    });
  }, [friend.id]);

  const level = state ? baseLevel(state) : null;
  const noop = () => undefined;
  return (
    <div className="social-screen social-visit">
      <header className="social-header">
        <button type="button" className="cyber-icon-btn cyber-icon-btn--back" onClick={onBack} aria-label={t.progress.back}>
          <ArrowLeft size={20} strokeWidth={2.6} />
        </button>
        <h1 className="social-title">{s.visitTitle(friend.name)}</h1>
        <button
          type="button"
          className="social-btn is-primary social-cheer-btn"
          disabled={cheered}
          onClick={async () => {
            const r = await cheerFriend(friend.id);
            if (r === 'cheered') {
              fx.coin();
              setToast(s.cheerSent);
              window.setTimeout(() => setToast(null), 2200);
            }
            setCheered(true);
          }}>
          <Hand size={16} strokeWidth={2.6} />
          {cheered ? s.cheered : s.cheer}
        </button>
      </header>
      {level && (
        <p className="social-visit-meta">
          {g.baseLevel.level(level.level)} · {g.baseLevel.titles[level.title as keyof typeof g.baseLevel.titles] ?? level.title} · {s.streak(friend.streak)}
        </p>
      )}
      <div className="base-board-wrap social-visit-board">
        {state ? (
          <BaseBoard
            state={state}
            plan={null}
            lit
            selectedUid={null}
            validTiles={null}
            labelForItem={(item) => g.items[item.itemId]?.name ?? item.itemId}
            onTile={noop}
            onItem={noop}
            tileLabel={() => ''}
          />
        ) : (
          <p className="social-muted social-visit-loading">{failed ? s.result.error : s.loading}</p>
        )}
      </div>
      {toast && (
        <div className="social-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
