import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import type { RotatingProgramPhase } from '../lib/rotatingProgram';

interface ProgramDayCarouselProps {
  cycle: readonly RotatingProgramPhase[];
  cycleDay: number;
  onSelectCycleDay: (cycleDay: number) => void;
  getPhaseLabel: (phase: RotatingProgramPhase) => string;
  isDark: boolean;
  isRestDay?: boolean;
  restTitle: string;
  restKicker: string;
}

const SWIPE_THRESHOLD = 56;

const CAROUSEL_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
};

function getCardColors(isActive: boolean, isDark: boolean, isRest: boolean) {
  if (isRest && isActive) {
    return isDark
      ? {
          borderColor: '#c8b0ff',
          backgroundColor: '#2a2438',
          boxShadow:
            '0 0 0 1px rgba(200, 176, 255, 0.45), 0 0 18px rgba(160, 120, 255, 0.4), 0 0 36px rgba(140, 100, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        }
      : {
          borderColor: '#9070e0',
          backgroundColor: '#ffffff',
          boxShadow:
            '0 0 0 1px rgba(144, 112, 224, 0.35), 0 0 14px rgba(144, 112, 224, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        };
  }

  if (isActive) {
    return isDark
      ? {
          borderColor: '#5dd4ff',
          backgroundColor: '#153545',
          boxShadow:
            '0 0 0 1px rgba(93, 212, 255, 0.45), 0 0 18px rgba(0, 200, 255, 0.42), 0 0 36px rgba(0, 178, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        }
      : {
          borderColor: '#00b2ff',
          backgroundColor: '#ffffff',
          boxShadow:
            '0 0 0 1px rgba(0, 178, 255, 0.35), 0 0 14px rgba(0, 178, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
        };
  }

  return isDark
    ? {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: '#252a30',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      }
    : {
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f0f2f5',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.85)'
      };
}

function getSlotMotion(isActive: boolean, direction: number, isRtl: boolean) {
  const travel = isActive ? 22 : 14;
  const enterX = direction * travel * (isRtl ? -1 : 1);
  const exitX = -enterX;

  return {
    initial: {
      opacity: 0,
      scale: isActive ? 0.94 : 0.9,
      x: enterX
    },
    animate: {
      opacity: isActive ? 1 : 0.88,
      scale: isActive ? 1 : 0.94,
      y: 0,
      x: 0
    },
    exit: {
      opacity: 0,
      scale: isActive ? 0.94 : 0.9,
      x: exitX
    }
  };
}

function ProgramDayCard({
  day,
  cycleLength,
  isActive,
  phaseLabel,
  isDark,
  direction,
  isRtl,
  isRest = false,
  restTitle = 'REST',
  restKicker = 'today',
  onClick
}: {
  day: number | null;
  cycleLength: number;
  isActive: boolean;
  phaseLabel: string;
  isDark: boolean;
  direction: number;
  isRtl: boolean;
  isRest?: boolean;
  restTitle?: string;
  restKicker?: string;
  onClick?: () => void;
}) {
  const colors = getCardColors(isActive, isDark, isRest);
  const motionState = getSlotMotion(isActive, direction, isRtl);
  const CardTag = onClick ? motion.button : motion.div;

  return (
    <CardTag
      type={onClick ? 'button' : undefined}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={`program-day-card ${isActive ? 'program-day-card--active' : 'program-day-card--side'}${
        isRest ? ' program-day-card--rest' : ''
      }`}
      onClick={onClick}
      initial={motionState.initial}
      animate={{
        ...motionState.animate,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        boxShadow: colors.boxShadow
      }}
      exit={motionState.exit}
      transition={CAROUSEL_TRANSITION}
      whileHover={
        onClick
          ? {
              opacity: 1,
              borderColor: isDark ? '#5dd4ff' : '#00c8ff'
            }
          : undefined
      }>
          {isActive ? (
        <>
          <span className="program-day-card-kicker">
            {isRest ? (
              restKicker
            ) : (
              <>
                day {day}
                <span className="program-day-card-kicker-sep">/</span>
                {cycleLength}
              </>
            )}
          </span>
          <span className="program-day-card-title">
            {isRest ? restTitle : phaseLabel}
          </span>
        </>
      ) : (
        <>
          <span className="program-day-side-day">day {day}</span>
          <span className="program-day-side-phase">{phaseLabel}</span>
        </>
      )}
    </CardTag>
  );
}

function ProgramDayDots({
  cycleDay,
  cycleLength,
  isRestDay
}: {
  cycleDay: number;
  cycleLength: number;
  isRestDay: boolean;
}) {
  return (
    <LayoutGroup id="program-day-dots">
      <div className="program-day-dots">
        {Array.from({ length: cycleLength }, (_, index) => {
          const day = index + 1;
          // On a rest day, highlight tomorrow's deferred training day as upcoming.
          const isActive = !isRestDay && day === cycleDay;

          return (
            <div key={day} className="program-day-dot-slot">
              <span className="program-day-dot program-day-dot--idle" />
              {isActive ? (
                <motion.span
                  layoutId="program-day-active-dot"
                  className="program-day-dot program-day-dot--active"
                  transition={CAROUSEL_TRANSITION}
                />
              ) : null}
            </div>
          );
        })}
        {isRestDay ? (
          <div className="program-day-dot-slot" aria-hidden="true">
            <span className="program-day-dot program-day-dot--rest" />
          </div>
        ) : null}
      </div>
    </LayoutGroup>
  );
}

export function ProgramDayCarousel({
  cycle,
  cycleDay,
  onSelectCycleDay,
  getPhaseLabel,
  isDark,
  isRestDay = false,
  restTitle,
  restKicker
}: ProgramDayCarouselProps) {
  const { isRtl } = useLanguage();
  const pointerStartX = useRef<number | null>(null);
  const prevCycleDayRef = useRef(cycleDay);
  const [direction, setDirection] = useState(0);

  const cycleLength = cycle.length;
  // A template switch can leave cycleDay above the new cycle length briefly.
  const safeCycleDay = Math.min(Math.max(cycleDay, 1), cycleLength);

  // On rest day, cycleDay is the deferred (tomorrow) training day.
  const prevDay = safeCycleDay > 1 ? safeCycleDay - 1 : null;
  const nextDay = isRestDay
    ? null
    : safeCycleDay < cycleLength
      ? safeCycleDay + 1
      : null;
  const deferredDay = isRestDay ? safeCycleDay : null;

  const phaseLabel = useMemo(
    () => getPhaseLabel(cycle[safeCycleDay - 1]),
    [cycle, safeCycleDay, getPhaseLabel]
  );

  const prevPhaseLabel =
    prevDay !== null ? getPhaseLabel(cycle[prevDay - 1]) : '';
  const nextPhaseLabel = isRestDay
    ? getPhaseLabel(cycle[safeCycleDay - 1])
    : nextDay !== null
      ? getPhaseLabel(cycle[nextDay - 1])
      : '';

  useEffect(() => {
    const previousDay = prevCycleDayRef.current;
    if (safeCycleDay === previousDay) return;

    setDirection(safeCycleDay > previousDay ? 1 : -1);
    prevCycleDayRef.current = safeCycleDay;
  }, [safeCycleDay]);

  const goNext = useCallback(() => {
    if (isRestDay || nextDay === null) return;
    onSelectCycleDay(nextDay);
  }, [isRestDay, nextDay, onSelectCycleDay]);

  const goPrev = useCallback(() => {
    if (isRestDay || prevDay === null) return;
    onSelectCycleDay(prevDay);
  }, [isRestDay, prevDay, onSelectCycleDay]);

  const handlePointerDown = (clientX: number) => {
    if (isRestDay) return;
    pointerStartX.current = clientX;
  };

  const handlePointerUp = (clientX: number) => {
    if (isRestDay || pointerStartX.current === null) return;

    const rawDelta = clientX - pointerStartX.current;
    const delta = isRtl ? -rawDelta : rawDelta;
    pointerStartX.current = null;

    if (delta <= -SWIPE_THRESHOLD) {
      goNext();
      return;
    }
    if (delta >= SWIPE_THRESHOLD) {
      goPrev();
    }
  };

  return (
    <div className="program-day-carousel" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className="program-day-row"
        onPointerDown={(event) => handlePointerDown(event.clientX)}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
        onPointerLeave={() => {
          pointerStartX.current = null;
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) handlePointerDown(touch.clientX);
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0];
          if (touch) handlePointerUp(touch.clientX);
        }}
        role="tablist"
        aria-label="Program day">
        <div className="program-day-slot program-day-slot--prev">
          {prevDay !== null ? (
            <AnimatePresence mode="sync" initial={false}>
              <ProgramDayCard
                key={prevDay}
                day={prevDay}
                cycleLength={cycleLength}
                isActive={false}
                phaseLabel={prevPhaseLabel}
                isDark={isDark}
                direction={direction}
                isRtl={isRtl}
                onClick={isRestDay ? undefined : goPrev}
              />
            </AnimatePresence>
          ) : (
            <span className="program-day-spacer" aria-hidden="true" />
          )}
        </div>

        <div className="program-day-slot program-day-slot--center">
          <AnimatePresence mode="sync" initial={false}>
            {isRestDay ? (
              <ProgramDayCard
                key="rest"
                day={null}
                cycleLength={cycleLength}
                isActive
                isRest
                phaseLabel={restTitle}
                restTitle={restTitle}
                restKicker={restKicker}
                isDark={isDark}
                direction={direction}
                isRtl={isRtl}
              />
            ) : (
              <ProgramDayCard
                key={safeCycleDay}
                day={safeCycleDay}
                cycleLength={cycleLength}
                isActive
                phaseLabel={phaseLabel}
                isDark={isDark}
                direction={direction}
                isRtl={isRtl}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="program-day-slot program-day-slot--next">
          {isRestDay && deferredDay !== null ? (
            <AnimatePresence mode="sync" initial={false}>
              <ProgramDayCard
                key={`deferred-${deferredDay}`}
                day={deferredDay}
                cycleLength={cycleLength}
                isActive={false}
                phaseLabel={nextPhaseLabel}
                isDark={isDark}
                direction={direction}
                isRtl={isRtl}
              />
            </AnimatePresence>
          ) : nextDay !== null ? (
            <AnimatePresence mode="sync" initial={false}>
              <ProgramDayCard
                key={nextDay}
                day={nextDay}
                cycleLength={cycleLength}
                isActive={false}
                phaseLabel={nextPhaseLabel}
                isDark={isDark}
                direction={direction}
                isRtl={isRtl}
                onClick={goNext}
              />
            </AnimatePresence>
          ) : (
            <span className="program-day-spacer" aria-hidden="true" />
          )}
        </div>
      </div>

      <ProgramDayDots
        cycleDay={safeCycleDay}
        cycleLength={cycleLength}
        isRestDay={isRestDay}
      />
    </div>
  );
}
