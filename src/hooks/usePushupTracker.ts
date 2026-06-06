import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  type NormalizedLandmark
} from '@mediapipe/tasks-vision';
import { PushupRepCounter } from '../lib/pose/pushupRepCounter';
import {
  playRepCheckSound,
  primeRepCheckSound
} from '../lib/sounds/repCheckSound';

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

export type TrackerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'tracking'
  | 'error';

export type CameraFacing = 'environment' | 'user';

export function usePushupTracker(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const counterRef = useRef(new PushupRepCounter());
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  const [reps, setReps] = useState(0);
  const [formHint, setFormHint] = useState<string | null>(null);
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(enabled);
  const [facingMode, setFacingMode] = useState<CameraFacing>('user');
  const [landmarkerReady, setLandmarkerReady] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    lastVideoTimeRef.current = -1;
  }, []);

  const stopAll = useCallback(() => {
    stopCamera();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setLandmarkerReady(false);
    counterRef.current.reset();
    setReps(0);
    setFormHint(null);
    setStatus('idle');
  }, [stopCamera]);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    if (video.currentTime === lastVideoTimeRef.current) {
      rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    lastVideoTimeRef.current = video.currentTime;

    const result = landmarker.detectForVideo(video, performance.now());
    const landmarks = result.landmarks[0] as NormalizedLandmark[] | undefined;

    if (landmarks) {
      const prevCount = counterRef.current.count;
      const count = counterRef.current.update(landmarks);
      if (count > prevCount) {
        playRepCheckSound();
      }
      setReps(count);
      setFormHint(counterRef.current.hint);
      setStatus('tracking');
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
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
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
      setStatus('ready');
      setError(null);
    },
    [detectFrame, stopCamera]
  );

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
      setFormHint(null);
      setLandmarkerReady(false);

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
      if (!cameraEnabled && landmarkerReady) setStatus('idle');
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
    setFormHint(null);
  }, []);

  return {
    videoRef,
    reps,
    formHint,
    status,
    error,
    cameraEnabled,
    facingMode,
    isMirrored: facingMode === 'user',
    toggleCamera,
    toggleFacingMode,
    resetReps
  };
}
