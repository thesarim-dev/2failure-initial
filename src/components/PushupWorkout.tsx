import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Move, BUTTON_LABELS } from './moves';
import { Camera, CameraOff, RotateCcw, SwitchCamera, Timer, X } from 'lucide-react';
import { usePushupTracker } from '../hooks/usePushupTracker';
import { TimedWorkout } from './TimedWorkout';

interface PushupWorkoutProps {
  move: Move;
  onFinish: (duration: number, trackedReps?: number) => void;
  onCancel: () => void;
}

interface PushupAiWorkoutProps extends PushupWorkoutProps {
  seconds: number;
  onUseTimerOnly: () => void;
}

function PushupAiWorkout({
  move,
  onFinish,
  onCancel,
  seconds,
  onUseTimerOnly
}: PushupAiWorkoutProps) {
  const [buttonLabel] = useState(
    () => BUTTON_LABELS[Math.floor(Math.random() * BUTTON_LABELS.length)]
  );
  const {
    videoRef,
    reps,
    formHint,
    status,
    error,
    cameraEnabled,
    facingMode,
    isMirrored,
    toggleCamera,
    toggleFacingMode,
    resetReps
  } = usePushupTracker(true);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statusLabel =
    status === 'loading'
      ? 'Loading AI...'
      : status === 'tracking'
        ? 'Tracking reps'
        : status === 'ready'
          ? 'Center head & shoulders'
          : status === 'error'
            ? 'Camera off'
            : 'Camera paused';

  return (
    <div
      className={`flex flex-col w-full min-h-screen ${move.color} p-4 md:p-8 transition-colors duration-200`}>
      <header className="flex justify-between items-center mb-4">
        <button
          onClick={onCancel}
          className="bg-white dark:bg-[#1a1a1a] dark:text-white border-4 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all">
          <X size={24} strokeWidth={3} />
        </button>
        <div className="bg-black text-white px-4 py-2 border-2 border-black dark:border-white font-bold uppercase tracking-widest text-sm">
          AI rep tracking
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center w-full max-w-md mx-auto">
        <h2 className="text-3xl md:text-4xl mb-2 text-center">{move.name}</h2>
        <p className="text-sm font-bold mb-2 text-center opacity-80">
          Face the camera — head & shoulders in the box · arms visible
        </p>
        {formHint && (
          <p className="text-xs font-bold mb-4 text-center bg-black text-[#CCFF00] px-3 py-1.5 border-2 border-black normal-case">
            {formHint}
          </p>
        )}
        {!formHint && <div className="mb-4" />}

        <div className="relative w-full aspect-[4/3] max-h-[42vh] border-4 border-black brutal-shadow-sm overflow-hidden bg-black rounded-2xl mb-4">
          <video
            ref={videoRef}
            className={`absolute left-1/2 top-0 h-[165%] w-[165%] -translate-x-1/2 object-cover object-[center_18%]${isMirrored ? ' scale-x-[-1]' : ''}`}
            playsInline
            muted
          />

          <div
            className="pointer-events-none absolute inset-x-6 top-5 bottom-[38%] rounded-xl border-2 border-dashed border-[#CCFF00]/80"
            aria-hidden
          />
          <p className="pointer-events-none absolute left-1/2 top-7 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-[#CCFF00]">
            Head & shoulders
          </p>

          {(!cameraEnabled || status === 'loading' || status === 'error') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-white p-4 text-center">
              {status === 'loading' && (
                <p className="font-bold text-sm uppercase tracking-widest">
                  Loading pose model...
                </p>
              )}
              {status === 'error' && (
                <>
                  <p className="font-bold text-sm mb-2">Camera unavailable</p>
                  <p className="text-xs opacity-80">{error}</p>
                </>
              )}
              {!cameraEnabled && status !== 'loading' && (
                <p className="font-bold text-sm">Camera paused</p>
              )}
            </div>
          )}

          <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1 text-xs font-bold uppercase">
            {statusLabel}
          </div>

          <div className="absolute bottom-3 right-3 bg-[#CCFF00] text-black border-2 border-black px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Reps
            </p>
            <p className="font-display text-4xl leading-none tabular-nums">
              {reps}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full mb-4">
          <button
            type="button"
            onClick={toggleCamera}
            className="flex-1 bg-black text-white border-4 border-black p-3 flex items-center justify-center gap-2 font-bold text-sm brutal-shadow-sm brutal-shadow-hover transition-all">
            {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
            {cameraEnabled ? 'Pause cam' : 'Resume cam'}
          </button>
          <button
            type="button"
            onClick={toggleFacingMode}
            disabled={!cameraEnabled}
            className="flex-1 bg-white text-black border-4 border-black p-3 flex items-center justify-center gap-2 font-bold text-sm brutal-shadow-sm brutal-shadow-hover transition-all disabled:opacity-50">
            <SwitchCamera size={18} />
            {facingMode === 'user' ? 'Front cam' : 'Back cam'}
          </button>
          <button
            type="button"
            onClick={resetReps}
            className="bg-white text-black border-4 border-black p-3 brutal-shadow-sm brutal-shadow-hover transition-all"
            aria-label="Reset rep count">
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center w-full mb-6 gap-4">
          <motion.div
            className="font-display text-5xl tracking-tighter"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}>
            {formatTime(seconds)}
          </motion.div>

          <button
            type="button"
            onClick={onUseTimerOnly}
            className="shrink-0 bg-white/90 text-black border-2 border-black px-4 py-2 font-bold text-sm flex items-center gap-2 brutal-shadow-sm brutal-shadow-hover transition-all normal-case">
            <Timer size={16} />
            Use timer only
          </button>
        </div>
      </div>

      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        onClick={() =>
          onFinish(seconds, cameraEnabled && reps > 0 ? reps : undefined)
        }
        className="w-full bg-black text-white border-4 border-black dark:border-white p-6 brutal-shadow brutal-shadow-hover transition-all duration-200 mb-4">
        <span className="font-display text-3xl md:text-4xl block transform -skew-x-6">
          {buttonLabel}
        </span>
        {reps > 0 && (
          <span className="block text-sm font-bold mt-2 normal-case opacity-80">
            Logging {reps} tracked rep{reps === 1 ? '' : 's'}
          </span>
        )}
      </motion.button>
    </div>
  );
}

export function PushupWorkout({
  move,
  onFinish,
  onCancel
}: PushupWorkoutProps) {
  const [useTimerOnly, setUseTimerOnly] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (useTimerOnly) {
    return (
      <TimedWorkout
        move={move}
        onFinish={onFinish}
        onCancel={onCancel}
        seconds={seconds}
        onEnableAiTracking={() => setUseTimerOnly(false)}
      />
    );
  }

  return (
    <PushupAiWorkout
      move={move}
      onFinish={onFinish}
      onCancel={onCancel}
      seconds={seconds}
      onUseTimerOnly={() => setUseTimerOnly(true)}
    />
  );
}
