import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Move } from './moves';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  Timer,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePoseRepTracker } from '../hooks/usePoseRepTracker';
import type { PoseExerciseId } from '../lib/pose/repCounterFactory';
import { TimedWorkout } from './TimedWorkout';
import { WORKOUT_FINISH_BTN, WORKOUT_TIMER_GLOW } from './workoutUi';

interface AiRepWorkoutProps {
  move: Move;
  poseExerciseId: PoseExerciseId;
  finishing?: boolean;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

interface AiRepTrackingViewProps extends AiRepWorkoutProps {
  seconds: number;
  setSeconds: Dispatch<SetStateAction<number>>;
  onUseTimerOnly: () => void;
}

function AiRepTrackingView({
  move,
  poseExerciseId,
  finishing = false,
  onFinish,
  onCancel,
  seconds,
  setSeconds,
  onUseTimerOnly
}: AiRepTrackingViewProps) {
  const { t } = useLanguage();
  const [buttonLabel] = useState(
    () =>
      t.moves.buttonLabels[
        Math.floor(Math.random() * t.moves.buttonLabels.length)
      ]
  );
  const {
    videoRef,
    reps,
    status,
    sessionPhase,
    positionGuidance,
    countdownDisplay,
    error,
    cameraEnabled,
    facingMode,
    isMirrored,
    toggleCamera,
    toggleFacingMode
  } = usePoseRepTracker(true, poseExerciseId);

  useEffect(() => {
    if (sessionPhase !== 'active') return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionPhase, setSeconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statusLabel =
    status === 'loading'
      ? t.workout.statusLoading
      : sessionPhase === 'active'
        ? t.workout.statusTracking
        : sessionPhase === 'countdown'
          ? t.workout.statusCountdown
          : sessionPhase === 'awaiting_position'
            ? t.workout.statusPositioning
            : status === 'ready'
              ? t.workout.statusReady
              : status === 'error'
                ? t.workout.statusError
                : t.workout.statusPaused;

  const guidanceText = t.workout.positionGuidance[positionGuidance];
  const showPositionGuidance =
    cameraEnabled &&
    status !== 'loading' &&
    status !== 'error' &&
    (sessionPhase === 'awaiting_position' || sessionPhase === 'countdown');
  const trackingActive = sessionPhase === 'active';
  const countdownLabel =
    countdownDisplay === 'START'
      ? t.workout.countdownStart
      : countdownDisplay;

  return (
    <div
      className={`flex flex-col w-full min-h-screen ${move.color} p-3 md:p-5 transition-colors duration-200`}>
      <header className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={onCancel}
          className="cyber-icon-btn cyber-icon-btn--back shrink-0"
          aria-label={t.workout.cancel}>
          <X size={22} strokeWidth={2.5} />
        </button>
        <h2 className="workout-title flex-1 min-w-0 !mb-0 !text-[clamp(2rem,8vw,3.25rem)] leading-none text-center normal-case">
          {move.name}
        </h2>
        <div className="w-10 shrink-0" aria-hidden="true" />
      </header>

      <div className="flex flex-col items-center w-full max-w-md mx-auto gap-2">
        <p className="text-xs font-semibold opacity-75 mb-1 normal-case text-center leading-snug max-w-sm">
          {t.moves.poseAiHints[poseExerciseId]}
        </p>

        <div className="relative w-full aspect-[9/16] max-h-[68vh] workout-camera-frame">
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover${isMirrored ? ' scale-x-[-1]' : ''}`}
            playsInline
            muted
          />

          {(!cameraEnabled || status === 'loading' || status === 'error') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-white p-4 text-center">
              {status === 'loading' && (
                <p className="font-bold text-sm normal-case opacity-90">
                  {t.workout.loadingPoseModel}
                </p>
              )}
              {status === 'error' && (
                <>
                  <p className="font-bold text-sm mb-2 normal-case">
                    {t.workout.cameraUnavailable}
                  </p>
                  <p className="text-xs opacity-80 normal-case">{error}</p>
                </>
              )}
              {!cameraEnabled && status !== 'loading' && (
                <p className="font-bold text-sm normal-case">
                  {t.workout.cameraPaused}
                </p>
              )}
            </div>
          )}

          <AnimatePresence>
            {countdownDisplay && (
              <motion.div
                key={countdownDisplay}
                initial={{ opacity: 0, y: -12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.35 }}
                className="workout-countdown-banner"
                aria-live="assertive">
                <p className="workout-countdown-value">{countdownLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {showPositionGuidance && !countdownDisplay && (
            <div className="workout-position-guidance" aria-live="polite">
              <p className="workout-position-guidance-text">{guidanceText}</p>
            </div>
          )}

          <div className="absolute top-3 left-3 workout-overlay-chip normal-case">
            {statusLabel}
          </div>

          <div
            className={`absolute bottom-3 right-3 workout-rep-badge transition-opacity duration-300${trackingActive ? '' : ' opacity-35'}`}>
            <p className="text-[10px] font-bold lowercase tracking-wide opacity-80">
              {t.workout.reps}
            </p>
            <p className="workout-rep-count">{reps}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={toggleCamera}
            className="workout-tool-btn normal-case">
            {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
            {cameraEnabled ? t.workout.pauseCam : t.workout.resumeCam}
          </button>
          <button
            type="button"
            onClick={toggleFacingMode}
            disabled={!cameraEnabled}
            className="workout-tool-btn workout-tool-btn--light normal-case">
            <SwitchCamera size={18} />
            {facingMode === 'user' ? t.workout.frontCam : t.workout.backCam}
          </button>
        </div>

        <div className="flex items-center justify-center w-full gap-2 flex-wrap">
          <div
            className={`workout-timer text-[clamp(2rem,8vw,3rem)] leading-none transition-opacity duration-300 ${WORKOUT_TIMER_GLOW[move.lineupSlot]}${trackingActive ? '' : ' opacity-40'}`}>
            {formatTime(seconds)}
          </div>

          <button
            type="button"
            onClick={onUseTimerOnly}
            className="workout-secondary-btn normal-case !py-2 !px-3 !text-xs">
            <Timer size={14} strokeWidth={2.5} />
            {t.workout.useTimerOnly}
          </button>
        </div>
      </div>

      <motion.button
        type="button"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.35 }}
        disabled={finishing}
        onClick={() =>
          onFinish(seconds, cameraEnabled && reps > 0 ? reps : undefined)
        }
        className={`${WORKOUT_FINISH_BTN} mt-3 mb-3 !py-3 normal-case`}>
        <span>{finishing ? t.workout.saving : buttonLabel}</span>
        {reps > 0 && (
          <span className="block text-sm font-semibold mt-1 normal-case opacity-80">
            {t.workout.loggingReps(reps)}
          </span>
        )}
      </motion.button>
    </div>
  );
}

export function AiRepWorkout({
  move,
  poseExerciseId,
  finishing = false,
  onFinish,
  onCancel
}: AiRepWorkoutProps) {
  const [useTimerOnly, setUseTimerOnly] = useState(false);
  const [seconds, setSeconds] = useState(0);

  if (useTimerOnly) {
    return (
      <TimedWorkout
        move={move}
        finishing={finishing}
        onFinish={onFinish}
        onCancel={onCancel}
        seconds={seconds}
        onEnableAiTracking={() => setUseTimerOnly(false)}
      />
    );
  }

  return (
    <AiRepTrackingView
      move={move}
      poseExerciseId={poseExerciseId}
      finishing={finishing}
      onFinish={onFinish}
      onCancel={onCancel}
      seconds={seconds}
      setSeconds={setSeconds}
      onUseTimerOnly={() => setUseTimerOnly(true)}
    />
  );
}
