import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, Eye, Flame, Hand, Share2, UserPlus, Users, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fx } from '../lib/feedback';
import {
  addFriend,
  cheerFriend,
  claimSquadReward,
  createSquad,
  friendsOverview,
  inviteToSquad,
  leaveSquad,
  respondSquadInvite,
  squadInvites,
  squadMembers,
  SQUAD_MAX,
  myFriendCode,
  respondToRequest,
  squadStatus,
  SQUAD_MIN_TO_CLAIM,
  SQUAD_REWARD,
  SQUAD_SETS_EACH,
  type AddResult,
  type Friend,
  type SquadInvite,
  type SquadMember,
  type SquadStatus
} from '../lib/social';

/**
 * Friends: the weekly squad challenge, your friend code, adding friends,
 * requests, and your friends (visit their base, cheer them).
 */
export function FriendsScreen({
  onBack,
  onVisit,
  onSquadClaimed
}: {
  onBack: () => void;
  onVisit: (friend: Friend) => void;
  onSquadClaimed: (balance: number) => void;
}) {
  const { t } = useLanguage();
  const s = t.social;
  const [code, setCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [squad, setSquad] = useState<SquadStatus | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<AddResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [invites, setInvites] = useState<SquadInvite[]>([]);
  const [picked, setPicked] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const [list, sq, mem, inv] = await Promise.all([friendsOverview(), squadStatus(), squadMembers(), squadInvites()]);
    setFriends(list);
    setSquad(sq);
    setMembers(mem);
    setInvites(inv);
  }, []);
  useEffect(() => {
    void myFriendCode().then(setCode);
    void refresh();
  }, [refresh]);
  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  };

  const accepted = (friends ?? []).filter((f) => f.status === 'accepted');
  const incoming = (friends ?? []).filter((f) => f.status === 'pending' && f.incoming);
  const outgoing = (friends ?? []).filter((f) => f.status === 'pending' && !f.incoming);

  const submit = async () => {
    if (!input.trim()) return;
    const r = await addFriend(input);
    setResult(r);
    if (r === 'sent' || r === 'accepted') {
      fx.success();
      setInput('');
      await refresh();
    } else fx.error();
  };

  return (
    <div className="social-screen">
      <header className="social-header">
        <button type="button" className="cyber-icon-btn cyber-icon-btn--back" onClick={onBack} aria-label={t.progress.back}>
          <ArrowLeft size={20} strokeWidth={2.6} />
        </button>
        <h1 className="social-title">{s.title}</h1>
      </header>

      {/* This week's squad: the friends you picked to co-op with */}
      <section className="cyber-panel social-card social-squad">
        <h2 className="social-h2">
          <Users size={18} strokeWidth={2.6} aria-hidden="true" />
          {s.squadTitle}
        </h2>

        {invites.map((inv) => (
          <div key={inv.squadId} className="social-invite">
            <p className="social-invite-title">{s.squadInvited(inv.from)}</p>
            <p className="social-muted">{s.squadWith(inv.members.join(', '))}</p>
            <div className="social-invite-actions">
              <button
                type="button"
                className="social-btn is-primary"
                onClick={async () => {
                  fx.success();
                  await respondSquadInvite(inv.squadId, true);
                  await refresh();
                }}>
                <Check size={16} strokeWidth={2.8} />
                {s.join}
              </button>
              <button
                type="button"
                className="social-btn"
                aria-label={s.decline}
                onClick={async () => {
                  await respondSquadInvite(inv.squadId, false);
                  await refresh();
                }}>
                <X size={16} strokeWidth={2.8} />
              </button>
            </div>
          </div>
        ))}

        {!squad?.squadId ? (
          accepted.length === 0 ? (
            <p className="social-muted">{s.squadNeedFriends}</p>
          ) : (
            <>
              <p className="social-muted">{s.squadPick}</p>
              <div className="social-pick">
                {accepted.map((f) => {
                  const on = picked.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      className={`social-pick-chip ${on ? 'is-on' : ''}`}
                      aria-pressed={on}
                      disabled={!on && picked.length >= SQUAD_MAX - 1}
                      onClick={() => {
                        fx.tap();
                        setPicked((p) => (on ? p.filter((x) => x !== f.id) : [...p, f.id]));
                      }}>
                      {on && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                      {f.name}
                    </button>
                  );
                })}
              </div>
              <p className="social-reward">{s.reward(SQUAD_REWARD.coins, SQUAD_REWARD.materials)}</p>
              <button
                type="button"
                className="social-claim"
                disabled={picked.length === 0}
                onClick={async () => {
                  if (await createSquad(picked)) {
                    fx.success();
                    setPicked([]);
                  } else fx.error();
                  await refresh();
                }}>
                {s.squadStart}
              </button>
            </>
          )
        ) : (
          <>
            <ul className="social-members">
              {members.map((m) => (
                <li key={m.id} className={m.isMe ? 'is-you' : m.status === 'invited' ? 'is-invited' : ''}>
                  {m.isMe ? s.squadYou(m.sets) : `${m.name}: ${m.sets}`}
                  {m.status === 'invited' && ` · ${s.invitedTag}`}
                </li>
              ))}
            </ul>
            {squad.members >= 2 ? (
              <>
                <p className="social-squad-goal">{s.squadGoal(squad.total, squad.goal)}</p>
                <div className="social-bar" role="progressbar" aria-valuemin={0} aria-valuemax={squad.goal} aria-valuenow={squad.total}>
                  <i style={{ width: `${Math.min(100, (squad.total / Math.max(1, squad.goal)) * 100)}%` }} />
                </div>
                <p className="social-muted">{s.squadHint(SQUAD_SETS_EACH)}</p>
                <p className="social-reward">{s.reward(SQUAD_REWARD.coins, SQUAD_REWARD.materials)}</p>
                {squad.claimed ? (
                  <p className="social-claimed">{s.claimed}</p>
                ) : squad.total >= squad.goal && squad.mySets >= SQUAD_MIN_TO_CLAIM ? (
                  <button
                    type="button"
                    className="social-claim"
                    disabled={claiming}
                    onClick={async () => {
                      setClaiming(true);
                      const r = await claimSquadReward();
                      setClaiming(false);
                      if (r.ok) {
                        fx.levelUp();
                        flash(s.rewardToast);
                        onSquadClaimed(r.balance);
                      } else fx.error();
                      await refresh();
                    }}>
                    {s.claim}
                  </button>
                ) : squad.mySets < SQUAD_MIN_TO_CLAIM ? (
                  <p className="social-muted">{s.squadMore(SQUAD_MIN_TO_CLAIM - squad.mySets)}</p>
                ) : null}
              </>
            ) : (
              <p className="social-muted">{s.squadWaiting}</p>
            )}
            {members.length < SQUAD_MAX && accepted.some((f) => !members.some((m) => m.id === f.id)) && (
              <div className="social-pick">
                <span className="social-pick-label">{s.inviteMore}:</span>
                {accepted
                  .filter((f) => !members.some((m) => m.id === f.id))
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="social-pick-chip"
                      onClick={async () => {
                        fx.tap();
                        await inviteToSquad(f.id);
                        await refresh();
                      }}>
                      <UserPlus size={14} strokeWidth={2.6} aria-hidden="true" />
                      {f.name}
                    </button>
                  ))}
              </div>
            )}
            {!squad.claimed && (
              <button
                type="button"
                className="social-link"
                onClick={async () => {
                  await leaveSquad();
                  await refresh();
                }}>
                {s.leave}
              </button>
            )}
          </>
        )}
      </section>

      {/* Your code */}
      <section className="cyber-panel social-card">
        <h2 className="social-h2">{s.yourCode}</h2>
        <div className="social-code-row">
          <span className="social-code" dir="ltr">{code ?? '······'}</span>
          <button
            type="button"
            className="social-btn"
            disabled={!code}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code ?? '');
              } catch {
                // Clipboard blocked: the code is on screen to read out.
              }
              fx.tap();
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}>
            {copied ? <Check size={16} strokeWidth={2.8} /> : <Copy size={16} strokeWidth={2.6} />}
            {copied ? s.copied : s.copy}
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button type="button" className="social-btn" disabled={!code} onClick={() => void navigator.share?.({ text: s.shareText(code ?? '') }).catch(() => undefined)}>
              <Share2 size={16} strokeWidth={2.6} />
              {s.share}
            </button>
          )}
        </div>
      </section>

      {/* Add a friend */}
      <section className="cyber-panel social-card">
        <h2 className="social-h2">{s.addTitle}</h2>
        <form
          className="social-add"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}>
          <input
            className="social-input"
            dir="ltr"
            value={input}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder={s.addPlaceholder}
            aria-label={s.addPlaceholder}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              setResult(null);
            }}
          />
          <button type="submit" className="social-btn is-primary" disabled={!input.trim()}>
            <UserPlus size={16} strokeWidth={2.6} />
            {s.add}
          </button>
        </form>
        {result && <p className={`social-result ${result === 'sent' || result === 'accepted' ? 'is-ok' : ''}`}>{s.result[result]}</p>}
      </section>

      {/* Requests */}
      {incoming.length > 0 && (
        <section className="cyber-panel social-card">
          <h2 className="social-h2">{s.requests}</h2>
          <ul className="social-list">
            {incoming.map((f) => (
              <li key={f.id} className="social-friend">
                <span className="social-avatar">{f.name.slice(0, 1).toUpperCase()}</span>
                <span className="social-name">{f.name}</span>
                <button
                  type="button"
                  className="social-btn is-primary"
                  onClick={async () => {
                    fx.success();
                    await respondToRequest(f.id, true);
                    await refresh();
                  }}>
                  <Check size={16} strokeWidth={2.8} />
                  {s.accept}
                </button>
                <button
                  type="button"
                  className="social-btn"
                  aria-label={s.decline}
                  onClick={async () => {
                    await respondToRequest(f.id, false);
                    await refresh();
                  }}>
                  <X size={16} strokeWidth={2.8} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Friends */}
      <section className="cyber-panel social-card">
        <h2 className="social-h2">{s.friends}</h2>
        {friends === null ? (
          <p className="social-muted">{s.loading}</p>
        ) : accepted.length === 0 && outgoing.length === 0 ? (
          <p className="social-muted">{s.empty}</p>
        ) : (
          <ul className="social-list">
            {accepted.map((f) => (
              <li key={f.id} className="social-friend">
                <span className="social-avatar">{f.name.slice(0, 1).toUpperCase()}</span>
                <span className="social-friend-text">
                  <span className="social-name">{f.name}</span>
                  <span className="social-meta">
                    <Flame size={13} strokeWidth={2.6} aria-hidden="true" />
                    {s.streak(f.streak)} · {s.hq(f.hqLevel)} · {s.setsWeek(f.setsThisWeek)}
                  </span>
                </span>
                <button type="button" className="social-btn" onClick={() => onVisit(f)}>
                  <Eye size={16} strokeWidth={2.6} />
                  {s.visit}
                </button>
                <button
                  type="button"
                  className="social-btn"
                  disabled={f.cheeredToday}
                  aria-label={f.cheeredToday ? s.cheered : s.cheer}
                  onClick={async () => {
                    const r = await cheerFriend(f.id);
                    if (r === 'cheered') {
                      fx.coin();
                      flash(s.cheerSent);
                    }
                    await refresh();
                  }}>
                  <Hand size={16} strokeWidth={2.6} />
                </button>
              </li>
            ))}
            {outgoing.map((f) => (
              <li key={f.id} className="social-friend is-pending">
                <span className="social-avatar">{f.name.slice(0, 1).toUpperCase()}</span>
                <span className="social-friend-text">
                  <span className="social-name">{f.name}</span>
                  <span className="social-meta">{s.result.pending}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div className="social-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
