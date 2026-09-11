import { useState, useRef, useCallback, useEffect } from 'react';
import { createDemoFaceStream } from '../lib/demoFace';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const demoStopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (demoStopRef.current) {
      demoStopRef.current();
      demoStopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsDemoMode(false);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    stop();
    setStatus('requesting');
    setError(null);
    setIsDemoMode(false);

    const constraintOptions: MediaStreamConstraints[] = [
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let stream: MediaStream | null = null;
    let lastError: unknown = null;

    for (const constraints of constraintOptions) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
        console.warn('getUserMedia attempt failed with constraints:', constraints, err);
      }
    }

    if (!stream) {
      const err = lastError;
      let msg = 'Camera access denied or unavailable.';
      if (err instanceof Error) {
        if (err.name === 'NotReadableError') {
          msg =
            'Camera is in use by another application or unavailable. If using an ASUS laptop, check your F10 camera key or physical shutter slider.';
        } else if (err.name === 'NotAllowedError') {
          msg = 'Camera permission was denied. Please allow camera access in your browser.';
        } else if (err.name === 'NotFoundError') {
          msg = 'No camera device found on this system.';
        } else {
          msg = err.message;
        }
      }
      console.error('Camera error:', err);
      setError(msg);
      setStatus('error');
      return;
    }

    try {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .then(() => resolve())
              .catch((e) => {
                console.warn('video.play() warning:', e);
                resolve();
              });
          };
          setTimeout(() => {
            videoRef.current?.play().catch(() => {});
            resolve();
          }, 350);
        });
      }
      setStatus('active');
    } catch (err) {
      console.error('Error starting video stream playback:', err);
      setError(err instanceof Error ? err.message : 'Error playing camera video');
      setStatus('error');
    }
  }, [stop]);

  const startDemo = useCallback(async () => {
    stop();
    setStatus('requesting');
    setError(null);
    setIsDemoMode(true);

    try {
      const { stream, stop: stopStream } = createDemoFaceStream();
      streamRef.current = stream;
      demoStopRef.current = stopStream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve();
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .then(() => resolve())
              .catch(() => resolve());
          };
          setTimeout(() => {
            videoRef.current?.play().catch(() => {});
            resolve();
          }, 200);
        });
      }
      setStatus('active');
    } catch (err) {
      console.error('Error starting demo mode:', err);
      setError('Could not start demo stream');
      setStatus('error');
      setIsDemoMode(false);
    }
  }, [stop]);

  const toggle = useCallback(() => {
    if (status === 'active' || status === 'requesting') {
      stop();
    } else {
      start();
    }
  }, [status, start, stop]);

  useEffect(() => {
    return () => {
      if (demoStopRef.current) {
        demoStopRef.current();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    status,
    error,
    isDemoMode,
    start,
    startDemo,
    stop,
    toggle,
  };
}
