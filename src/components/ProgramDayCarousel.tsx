import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { ROTATION_CYCLE, ROTATION_CYCLE_LENGTH } from '../lib/rotatingProgram';

interface ProgramDayCarouselProps {
  cycleDay: number;
  onSelectCycleDay: (cycleDay: number) => void;
  getPhaseLabel: (phase: (typeof ROTATION_CYCLE)[number]) => string;
  isDark: boolean;
}

const SWIPE_THRESHOLD = 56;

const CAROUSEL_TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
};

function getCardColors(isActive: boolean, isDark: boolean) {
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
  isActive,
  phaseLabel,
  isDark,
  direction,
  isRtl,
  onClick
}: {
  day: number;
  isActive: boolean;
  phaseLabel: string;
  isDark: boolean;
  direction: number;
  isRtl: boolean;
  onClick?: () => void;
}) {
  const colors = getCardColors(isActive, isDark);
  const motionState = getSlotMotion(isActive, direction, isRtl);
  const CardTag = onClick ? motion.button : motion.div;

  return (
    <CardTag
      type={onClick ? 'button' : undefined}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={`program-day-card ${isActive ? 'program-day-card--active' : 'program-day-card--side'}`}
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
            day {day}
            <span className="program-day-card-kicker-sep">/</span>
            {ROTATION_CYCLE_LENGTH}
          </span>
          <span className="program-day-card-title">{phaseLabel}</span>
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

function ProgramDayDots({ cycleDay }: { cycleDay: number }) {
  return (
    <LayoutGroup id="program-day-dots">
      <div className="program-day-dots">
        {Array.from({ length: ROTATION_CYCLE_LENGTH }, (_, index) => {
          const day = index + 1;
          const isActive = day === cycleDay;

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
      </div>
    </LayoutGroup>
  );
}

export function ProgramDayCarousel({
  cycleDay,
  onSelectCycleDay,
  getPhaseLabel,
  isDark
}: ProgramDayCarouselProps) {
  const { isRtl } = useLanguage();
  const pointerStartX = useRef<number | null>(null);
  const prevCycleDayRef = useRef(cycleDay);
  const [direction, setDirection] = useState(0);

  const prevDay = cycleDay > 1 ? cycleDay - 1 : null;
  const nextDay = cycleDay < ROTATION_CYCLE_LENGTH ? cycleDay + 1 : null;

  const phaseLabel = useMemo(
    () => getPhaseLabel(ROTATION_CYCLE[cycleDay - 1]),
    [cycleDay, getPhaseLabel]
  );

  const prevPhaseLabel =
    prevDay !== null ? getPhaseLabel(ROTATION_CYCLE[prevDay - 1]) : '';
  const nextPhaseLabel =
    nextDay !== null ? getPhaseLabel(ROTATION_CYCLE[nextDay - 1]) : '';

  useEffect(() => {
    const previousDay = prevCycleDayRef.current;
    if (cycleDay === previousDay) return;

    setDirection(cycleDay > previousDay ? 1 : -1);
    prevCycleDayRef.current = cycleDay;
  }, [cycleDay]);

  const goNext = useCallback(() => {
    if (nextDay !== null) onSelectCycleDay(nextDay);
  }, [nextDay, onSelectCycleDay]);

  const goPrev = useCallback(() => {
    if (prevDay !== null) onSelectCycleDay(prevDay);
  }, [prevDay, onSelectCycleDay]);

  const handlePointerDown = (clientX: number) => {
    pointerStartX.current = clientX;
  };

  const handlePointerUp = (clientX: number) => {
    if (pointerStartX.current === null) return;

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
                isActive={false}
                phaseLabel={prevPhaseLabel}
                isDark={isDark}
                direction={direction}
                isRtl={isRtl}
                onClick={goPrev}
              />
            </AnimatePresence>
          ) : (
            <span className="program-day-spacer" aria-hidden="true" />
          )}
        </div>

        <div className="program-day-slot program-day-slot--center">
          <AnimatePresence mode="sync" initial={false}>
            <ProgramDayCard
              key={cycleDay}
              day={cycleDay}
              isActive
              phaseLabel={phaseLabel}
              isDark={isDark}
              direction={direction}
              isRtl={isRtl}
            />
          </AnimatePresence>
        </div>

        <div className="program-day-slot program-day-slot--next">
          {nextDay !== null ? (
            <AnimatePresence mode="sync" initial={false}>
              <ProgramDayCard
                key={nextDay}
                day={nextDay}
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

      <ProgramDayDots cycleDay={cycleDay} />
    </div>
  );
}
