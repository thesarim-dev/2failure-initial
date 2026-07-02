import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark
} from '@mediapipe/tasks-vision';
import {
  createRepCounter,
  type PoseExerciseId
} from '../lib/pose/repCounterFactory';
import {
  assessStartingPosition,
  COUNTDOWN_CANCEL_BAD_FRAMES,
  POSITION_STABLE_TARGET,
  STABLE_BAD_DECREMENT,
  STABLE_GOOD_INCREMENT,
  STABLE_WOBBLY_INCREMENT,
  sampleVideoBrightness,
  type PositionGuidanceKey
} from '../lib/pose/startingPosition';
import {
  playRepCheckSound,
  primeRepCheckSound
} from '../lib/sounds/repCheckSound';

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export type TrackerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'tracking'
  | 'error';

export type SessionPhase =
  | 'booting'
  | 'awaiting_position'
  | 'countdown'
  | 'active'
  | 'paused';

export type CameraFacing = 'environment' | 'user';

function resetSessionPhase(
  sessionPhaseRef: MutableRefObject<SessionPhase>,
  setSessionPhase: (phase: SessionPhase) => void,
  stablePositionFramesRef: MutableRefObject<number>,
  countdownBadFramesRef: MutableRefObject<number>,
  setCountdownDisplay: (value: string | null) => void
) {
  sessionPhaseRef.current = 'awaiting_position';
  setSessionPhase('awaiting_position');
  stablePositionFramesRef.current = 0;
  countdownBadFramesRef.current = 0;
  setCountdownDisplay(null);
}

export function usePoseRepTracker(
  enabled: boolean,
  exerciseId: PoseExerciseId
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const counterRef = useRef(createRepCounter(exerciseId));
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const sessionPhaseRef = useRef<SessionPhase>('booting');
  const stablePositionFramesRef = useRef(0);
  const countdownBadFramesRef = useRef(0);
  const brightnessSampleCounterRef = useRef(0);
  const lastBrightnessRef = useRef<number | null>(null);
  const exerciseIdRef = useRef(exerciseId);

  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('booting');
  const [positionGuidance, setPositionGuidance] =
    useState<PositionGuidanceKey>('no_pose');
  const [countdownDisplay, setCountdownDisplay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(enabled);
  const [facingMode, setFacingMode] = useState<CameraFacing>('environment');
  const [landmarkerReady, setLandmarkerReady] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    lastVideoTimeRef.current = -1;
    brightnessSampleCounterRef.current = 0;
    lastBrightnessRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    stopCamera();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setLandmarkerReady(false);
    counterRef.current.reset();
    setReps(0);
    setStatus('idle');
    sessionPhaseRef.current = 'booting';
    setSessionPhase('booting');
    stablePositionFramesRef.current = 0;
    countdownBadFramesRef.current = 0;
    setCountdownDisplay(null);
    setPositionGuidance('no_pose');
  }, [stopCamera]);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    const currentExerciseId = exerciseIdRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    if (video.currentTime === lastVideoTimeRef.current) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    lastVideoTimeRef.current = video.currentTime;

    brightnessSampleCounterRef.current += 1;
    if (brightnessSampleCounterRef.current % 10 === 0) {
      lastBrightnessRef.current = sampleVideoBrightness(video);
    }

    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks = result.landmarks[0] as NormalizedLandmark[] | undefined;
    const phase = sessionPhaseRef.current;

    if (phase === 'awaiting_position' || phase === 'countdown') {
      const assessment = assessStartingPosition(
        currentExerciseId,
        landmarks,
        lastBrightnessRef.current
      );

      if (phase === 'awaiting_position') {
        if (!landmarks) {
          setPositionGuidance('no_pose');
          stablePositionFramesRef.current = Math.max(
            0,
            stablePositionFramesRef.current - 3
          );
          setStatus('ready');
        } else {
          switch (assessment.readiness) {
            case 'good':
              stablePositionFramesRef.current += STABLE_GOOD_INCREMENT;
              break;
            case 'wobbly':
              stablePositionFramesRef.current += STABLE_WOBBLY_INCREMENT;
              break;
            case 'bad':
              stablePositionFramesRef.current = Math.max(
                0,
                stablePositionFramesRef.current - STABLE_BAD_DECREMENT
              );
              break;
          }

          const settlingIn =
            assessment.readiness !== 'bad' &&
            stablePositionFramesRef.current >= POSITION_STABLE_TARGET / 3;

          setPositionGuidance(
            settlingIn ? 'hold_still' : assessment.guidance
          );

          if (stablePositionFramesRef.current >= POSITION_STABLE_TARGET) {
            sessionPhaseRef.current = 'countdown';
            setSessionPhase('countdown');
            stablePositionFramesRef.current = 0;
            countdownBadFramesRef.current = 0;
          }

          setStatus('ready');
        }
      } else if (!landmarks || assessment.readiness === 'bad') {
        countdownBadFramesRef.current += 1;
        if (countdownBadFramesRef.current >= COUNTDOWN_CANCEL_BAD_FRAMES) {
          setPositionGuidance(assessment.guidance);
          resetSessionPhase(
            sessionPhaseRef,
            setSessionPhase,
            stablePositionFramesRef,
            countdownBadFramesRef,
            setCountdownDisplay
          );
        }
        setStatus('ready');
      } else {
        countdownBadFramesRef.current = Math.max(
          0,
          countdownBadFramesRef.current - 1
        );
      }
    } else if (phase === 'active') {
      if (landmarks) {
        const prevCount = counterRef.current.count;
        const count = counterRef.current.update(landmarks);
        if (count > prevCount) {
          playRepCheckSound();
        }
        setReps(count);
        setStatus('tracking');
      }
    }

    rafRef.current = requestAnimationFrame(detectFrame);
  }, []);

  const startCamera = useCallback(
    async (facing: CameraFacing) => {
      if (!landmarkerRef.current || !videoRef.current) return;

      stopCamera();

      const constraintSets: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { exact: facing },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        { video: true, audio: false }
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraint of constraintSets) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError instanceof Error
          ? lastError
          : new Error('Camera access was denied.');
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      primeRepCheckSound();
      await videoRef.current.play();
      rafRef.current = requestAnimationFrame(detectFrame);
      resetSessionPhase(
        sessionPhaseRef,
        setSessionPhase,
        stablePositionFramesRef,
        countdownBadFramesRef,
        setCountdownDisplay
      );
      setStatus('ready');
      setError(null);
    },
    [detectFrame, stopCamera]
  );

  useEffect(() => {
    exerciseIdRef.current = exerciseId;
    counterRef.current = createRepCounter(exerciseId);
    counterRef.current.reset();
    setReps(0);
    if (sessionPhaseRef.current !== 'booting') {
      resetSessionPhase(
        sessionPhaseRef,
        setSessionPhase,
        stablePositionFramesRef,
        countdownBadFramesRef,
        setCountdownDisplay
      );
    }
  }, [exerciseId]);

  useEffect(() => {
    if (sessionPhase !== 'countdown') return;

    setCountdownDisplay('3');

    const showTwo = window.setTimeout(() => setCountdownDisplay('2'), 1000);
    const showOne = window.setTimeout(() => setCountdownDisplay('1'), 2000);
    const showStart = window.setTimeout(
      () => setCountdownDisplay('START'),
      3000
    );
    const beginTracking = window.setTimeout(() => {
      if (sessionPhaseRef.current !== 'countdown') return;
      sessionPhaseRef.current = 'active';
      setSessionPhase('active');
      counterRef.current.reset();
      setReps(0);
      setCountdownDisplay(null);
    }, 3800);

    return () => {
      window.clearTimeout(showTwo);
      window.clearTimeout(showOne);
      window.clearTimeout(showStart);
      window.clearTimeout(beginTracking);
    };
  }, [sessionPhase]);

  useEffect(() => {
    if (!enabled) {
      stopAll();
      return;
    }

    let cancelled = false;

    const boot = async () => {
      setStatus('loading');
      setError(null);
      counterRef.current.reset();
      setReps(0);
      setLandmarkerReady(false);
      sessionPhaseRef.current = 'booting';
      setSessionPhase('booting');

      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
        if (cancelled) return;

        const createLandmarker = (delegate: 'GPU' | 'CPU') =>
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate
            },
            runningMode: 'VIDEO',
            numPoses: 1
          });

        let landmarker: PoseLandmarker;
        try {
          landmarker = await createLandmarker('GPU');
        } catch {
          landmarker = await createLandmarker('CPU');
        }

        if (cancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setLandmarkerReady(true);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(
          err instanceof Error ? err.message : 'Could not start pose tracking.'
        );
        stopCamera();
      }
    };

    void boot();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [enabled, stopAll, stopCamera]);

  useEffect(() => {
    if (!enabled || !cameraEnabled || !landmarkerReady) {
      stopCamera();
      if (!cameraEnabled && landmarkerReady) {
        sessionPhaseRef.current = 'paused';
        setSessionPhase('paused');
        setStatus('idle');
        setCountdownDisplay(null);
      }
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStatus('loading');
      try {
        await startCamera(facingMode);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(
          err instanceof Error ? err.message : 'Could not start camera.'
        );
        stopCamera();
      }
    };

    void run();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [
    enabled,
    cameraEnabled,
    facingMode,
    landmarkerReady,
    startCamera,
    stopCamera
  ]);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((on) => !on);
  }, []);

  const toggleFacingMode = useCallback(() => {
    setFacingMode((mode) => (mode === 'environment' ? 'user' : 'environment'));
  }, []);

  const resetReps = useCallback(() => {
    counterRef.current.reset();
    setReps(0);
  }, []);

  return {
    videoRef,
    reps,
    status,
    sessionPhase,
    positionGuidance,
    countdownDisplay,
    error,
    cameraEnabled,
    facingMode,
    isMirrored: facingMode === 'user',
    toggleCamera,
    toggleFacingMode,
    resetReps
  };
}
