import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent
} from 'react';
import { ArrowRight, ChevronLeft, Play } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Coach-mark tour over the live home screen. Targets are found by
 * `data-tour="<id>"` attributes in Dashboard. Steps whose target is missing
 * (e.g. the program banner when the program is off) are skipped. The last
 * step spotlights the first workout card that can still be started and
 * starts it for real.
 */

export type TourStepId =
  | 'welcome'
  | 'lineup'
  | 'streak'
  | 'coins'
  | 'store'
  | 'settings'
  | 'program'
  | 'start';

const STEP_ORDER: TourStepId[] = [
  'welcome',
  'lineup',
  'streak',
  'coins',
  'store',
  'settings',
  'program',
  'start'
];

/** Ring colour per step, matched to the element being highlighted. */
const STEP_ACCENT: Record<TourStepId, string> = {
  welcome: 'var(--tour-cyan)',
  lineup: 'var(--tour-cyan)',
  streak: 'var(--tour-orange)',
  coins: 'var(--tour-cyan)',
  store: 'var(--tour-lime)',
  settings: 'var(--tour-amber)',
  program: 'var(--tour-cyan)',
  start: 'var(--tour-start)'
};

const START_TARGET = '[data-tour="move"]:not(:disabled)';
const EDGE = 12;
const GAP = 14;

type Rect = { top: number; left: number; width: number; height: number; radius: number };

function selectorFor(step: TourStepId): string | null {
  if (step === 'welcome') return null;
  if (step === 'start') return START_TARGET;
  return `[data-tour="${step}"]`;
}

function findTarget(step: TourStepId): HTMLElement | null {
  const selector = selectorFor(step);
  return selector ? document.querySelector<HTMLElement>(selector) : null;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function measure(el: HTMLElement, pad: number): Rect {
  const r = el.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
    radius: Math.min(radius + pad, (Math.min(r.width, r.height) + pad * 2) / 2)
  };
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

interface GuidedTourProps {
  /** Called when the tour closes. `started` is true when it ended by starting a workout. */
  onClose: (started: boolean) => void;
}

export function GuidedTour({ onClose }: GuidedTourProps) {
  const { t } = useLanguage();
  const copy = t.tutorial;
  const [steps, setSteps] = useState<TourStepId[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  const closedRef = useRef(false);

  // Resolve which steps exist once the dashboard has rendered its cards.
  useEffect(() => {
    let frame = 0;
    let tries = 0;
    const resolve = () => {
      const ready = document.querySelector('[data-tour="lineup"]');
      if (!ready && tries++ < 120) {
        frame = requestAnimationFrame(resolve);
        return;
      }
      setSteps(STEP_ORDER.filter((id) => id === 'welcome' || findTarget(id)));
    };
    frame = requestAnimationFrame(resolve);
    return () => cancelAnimationFrame(frame);
  }, []);

  const step = steps?.[index] ?? 'welcome';
  const total = steps?.length ?? 1;
  const isLast = index === total - 1;
  const isStart = step === 'start';

  const close = useCallback(
    (started: boolean) => {
      if (closedRef.current) return;
      closedRef.current = true;
      onClose(started);
    },
    [onClose]
  );

  // Scroll so the target and the card both fit on screen. Runs once the
  // card has been measured for this step, using its real height.
  useLayoutEffect(() => {
    const el = findTarget(step);
    if (!el || !cardSize.height) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const cardH = cardSize.height;
    const fitsBelow = r.top >= EDGE && r.bottom + GAP + cardH <= vh - EDGE;
    const fitsAbove = r.top - GAP - cardH >= EDGE && r.bottom <= vh - EDGE;
    if (fitsBelow || fitsAbove) return;
    // Put the target near the top, leaving the space below for the card.
    window.scrollBy({
      top: r.top - (EDGE + 8),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
    // Only re-check when the step or the card's size changes, not on every scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cardSize.height]);

  // Track the target every frame so the ring follows scrolling and card animations.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const el = findTarget(step);
      const small = el ? el.getBoundingClientRect().width < 80 : false;
      const next = el ? measure(el, small ? 6 : 8) : null;
      setRect((prev) => (sameRect(prev, next) ? prev : next));
      const card = cardRef.current;
      if (card) {
        const { offsetWidth: width, offsetHeight: height } = card;
        setCardSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height }
        );
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Focus: remember where focus was, move it into the card each step, restore on close.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    return () => {
      const prev = restoreFocusRef.current;
      if (prev instanceof HTMLElement) prev.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [index, steps]);

  const goNext = useCallback(() => {
    if (isLast) {
      close(false);
      return;
    }
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [close, isLast, total]);

  const goBack = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  const startWorkout = useCallback(() => {
    const el = findTarget('start');
    close(true);
    el?.click();
  }, [close]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const rtl = document.documentElement.dir === 'rtl';
    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
    } else if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) {
      event.preventDefault();
      if (isStart) startWorkout();
      else goNext();
    } else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) {
      event.preventDefault();
      goBack();
    } else if (event.key === 'Tab' && cardRef.current) {
      const focusables = cardRef.current.querySelectorAll<HTMLElement>('button');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const { startName, startColor } = useMemo(() => {
    const el = steps?.includes('start') ? findTarget('start') : null;
    return {
      startName: el?.dataset.tourName ?? '',
      startColor: el ? getComputedStyle(el).backgroundColor : 'var(--tour-cyan)'
    };
  }, [steps]);

  const content = useMemo(() => {
    if (step === 'start') {
      return {
        title: copy.steps.start.title,
        body: copy.steps.start.body(startName)
      };
    }
    return copy.steps[step];
  }, [copy, step, startName]);

  // Place the card below the target, else above, else pinned to the bottom edge.
  const cardStyle = useMemo<CSSProperties>(() => {
    const width = Math.min(352, viewport.width - EDGE * 2);
    if (!rect) {
      return {
        width,
        left: (viewport.width - width) / 2,
        top: Math.max(EDGE, (viewport.height - cardSize.height) / 2)
      };
    }
    const centerX = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(EDGE, centerX - width / 2),
      viewport.width - width - EDGE
    );
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - cardSize.height;
    let top: number;
    if (below + cardSize.height <= viewport.height - EDGE) top = below;
    else if (above >= EDGE) top = above;
    else top = viewport.height - cardSize.height - EDGE;
    return { width, left, top };
  }, [rect, cardSize.height, viewport]);

  if (!steps) return null;

  const spotlightStyle: CSSProperties = rect
    ? {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: rect.radius
      }
    : {
        top: viewport.height / 2,
        left: viewport.width / 2,
        width: 0,
        height: 0,
        borderRadius: 999
      };

  return (
    <div
      className="tour-root"
      style={
        {
          '--tour-start': startColor,
          '--tour-accent': STEP_ACCENT[step]
        } as CSSProperties
      }
      onKeyDown={onKeyDown}>
      {/* Blocks the app underneath; clicking the dim area does nothing so taps don't end the tour by accident. */}
      <div className="tour-blocker" aria-hidden="true" />

      <div
        className={`tour-spotlight ${rect ? 'is-visible' : ''} ${isStart ? 'is-actionable' : ''}`}
        style={spotlightStyle}
        aria-hidden="true"
        onClick={isStart ? startWorkout : undefined}
      />

      <div
        ref={cardRef}
        className={`tour-card cyber-panel normal-case ${isStart ? 'tour-card--start' : ''}`}
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body">
        <div className="tour-progress" aria-hidden="true">
          {steps.map((id, i) => (
            <span
              key={id}
              className={`tour-progress-seg ${i <= index ? 'is-filled' : ''}`}
            />
          ))}
        </div>
        <p className="tour-count">{copy.stepLabel(index + 1, total)}</p>

        <h2 id="tour-title" className="tour-title" aria-live="polite">
          {content.title}
        </h2>
        <p id="tour-body" className="tour-body">
          {content.body}
        </p>

        {isStart ? (
          <div className="tour-actions tour-actions--start">
            <button
              ref={primaryRef}
              type="button"
              className="tour-btn tour-btn--start"
              onClick={startWorkout}>
              <Play size={15} strokeWidth={2.75} fill="currentColor" aria-hidden="true" />
              {copy.startCta(startName)}
            </button>
            <div className="tour-actions-row">
              <button type="button" className="tour-skip" onClick={() => close(false)}>
                {copy.skip}
              </button>
              <button type="button" className="tour-btn tour-btn--ghost" onClick={goBack}>
                <ChevronLeft size={16} strokeWidth={2.5} className="tour-icon-flip" aria-hidden="true" />
                {copy.back}
              </button>
            </div>
          </div>
        ) : (
          <div className="tour-actions-row">
            <button type="button" className="tour-skip" onClick={() => close(false)}>
              {copy.skip}
            </button>
            <div className="tour-nav">
              {index > 0 && (
                <button type="button" className="tour-btn tour-btn--ghost" onClick={goBack}>
                  <ChevronLeft size={16} strokeWidth={2.5} className="tour-icon-flip" aria-hidden="true" />
                  {copy.back}
                </button>
              )}
              <button
                ref={primaryRef}
                type="button"
                className="tour-btn tour-btn--primary"
                onClick={goNext}>
                {index === 0 ? copy.begin : isLast ? copy.finish : copy.next}
                {!isLast && (
                  <ArrowRight size={16} strokeWidth={2.5} className="tour-icon-flip" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
