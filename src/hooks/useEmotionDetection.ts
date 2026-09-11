import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { FaceData, EmotionScores, EmotionType } from '../lib/types';
import {
  computeEyeOpenness,
  smoothScores,
  detectDominantEmotion,
  computeEmotionTrend,
  computeBehavioralState,
  getConfidenceLevel,
  getEmotionMeta,
} from '../lib/emotions';

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HUDOptions {
  box: BoundingBox;
  emotion: EmotionType;
  confidence: number;
  eyeOpenness: number;
  landmarks: { x: number; y: number }[];
}

function drawDetectionHUD(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  hud: HUDOptions
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { box, emotion, confidence, landmarks } = hud;
  const meta = getEmotionMeta(emotion);
  const color = meta.color || '#8b5cf6';
  const pad = 12;
  const x = box.x - pad;
  const y = box.y - pad;
  const w = box.width + pad * 2;
  const h = box.height + pad * 2;
  const radius = 14;

  // Bounding box with glow
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.globalAlpha = 0.85;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Confidence Pill
  const confText = `${meta.emoji} ${meta.label} · ${Math.round(confidence * 100)}%`;
  ctx.save();
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  const textWidth = ctx.measureText(confText).width + 16;
  const badgeHeight = 22;
  const badgeX = x + w / 2 - textWidth / 2;
  const badgeY = y - badgeHeight / 2 - 8;

  ctx.fillStyle = '#0f172acc';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY - badgeHeight / 2, textWidth, badgeHeight, 6);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(confText, badgeX + 8, badgeY);
  ctx.restore();

  // Eye & Eyebrow landmarks
  const eyeLandmarkIndices = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  for (const idx of eyeLandmarkIndices) {
    const pt = landmarks[idx];
    if (pt) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

const BUFFER_SIZE = 12;
const DETECT_INTERVAL_MS = 100;

export function useEmotionDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [history, setHistory] = useState<FaceData[]>([]);

  const dominantHistoryRef = useRef<EmotionType[]>([]);
  const expressionsBufferRef = useRef<EmotionScores[]>([]);
  const detectionHistoryRef = useRef<boolean[]>([]);
  const scoreHistoryRef = useRef<number[]>([]);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastFaceDataRef = useRef<FaceData | null>(null);

  const loadModels = useCallback(async () => {
    setModelStatus('loading');
    try {
      const modelsUri = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelsUri),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelsUri),
        faceapi.nets.faceExpressionNet.loadFromUri(modelsUri),
      ]);
      setModelStatus('ready');
    } catch (err) {
      console.error('Failed to load face-api models:', err);
      setModelStatus('error');
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const detectFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.paused || video.ended) {
      return;
    }

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.3,
      });

      const detection = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks(true)
        .withFaceExpressions();

      const timestamp = new Date().toISOString();
      const canvas = canvasRef.current;

      if (!detection) {
        if (canvas) {
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        }
        detectionHistoryRef.current.push(false);
        if (detectionHistoryRef.current.length > BUFFER_SIZE) {
          detectionHistoryRef.current.shift();
        }

        const behavioralState = computeBehavioralState(
          detectionHistoryRef.current,
          dominantHistoryRef.current,
          scoreHistoryRef.current,
          0.5
        );

        const prev = lastFaceDataRef.current;
        const noFaceData: FaceData = {
          dominantEmotion: prev?.dominantEmotion ?? 'neutral',
          emotionScores: prev?.emotionScores ?? {
            happy: 0,
            sad: 0,
            angry: 0,
            fearful: 0,
            disgusted: 0,
            surprised: 0,
            neutral: 1,
          },
          emotionTrend: computeEmotionTrend(dominantHistoryRef.current),
          behavioralState,
          confidence: 0,
          confidenceLevel: 'uncertain',
          timestamp,
          faceDetected: false,
          eyeOpenness: 0,
        };

        lastFaceDataRef.current = noFaceData;
        setFaceData(noFaceData);
        return;
      }

      const expressions = detection.expressions as unknown as EmotionScores;
      const score = detection.detection.score;
      const landmarks = detection.landmarks.positions.map((pt) => ({
        x: pt.x,
        y: pt.y,
      }));
      const eyeOpenness = computeEyeOpenness(landmarks);

      expressionsBufferRef.current.push(expressions);
      scoreHistoryRef.current.push(score);
      detectionHistoryRef.current.push(true);

      if (expressionsBufferRef.current.length > BUFFER_SIZE) {
        expressionsBufferRef.current.shift();
      }
      if (scoreHistoryRef.current.length > BUFFER_SIZE) {
        scoreHistoryRef.current.shift();
      }
      if (detectionHistoryRef.current.length > BUFFER_SIZE) {
        detectionHistoryRef.current.shift();
      }

      const smoothedScores = smoothScores(expressionsBufferRef.current);
      const dominantEmotion = detectDominantEmotion(smoothedScores);

      dominantHistoryRef.current.push(dominantEmotion);
      if (dominantHistoryRef.current.length > BUFFER_SIZE) {
        dominantHistoryRef.current.shift();
      }

      const emotionTrend = computeEmotionTrend(dominantHistoryRef.current);
      const behavioralState = computeBehavioralState(
        detectionHistoryRef.current,
        dominantHistoryRef.current,
        scoreHistoryRef.current,
        eyeOpenness
      );

      const avgConfidence =
        scoreHistoryRef.current.reduce((a, b) => a + b, 0) /
        scoreHistoryRef.current.length;

      const currentData: FaceData = {
        dominantEmotion,
        emotionScores: smoothedScores,
        emotionTrend,
        behavioralState,
        confidence: avgConfidence,
        confidenceLevel: getConfidenceLevel(avgConfidence),
        timestamp,
        faceDetected: true,
        eyeOpenness,
      };

      if (canvas && video) {
        const box = detection.detection.box;
        drawDetectionHUD(canvas, video, {
          box: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          },
          emotion: dominantEmotion,
          confidence: avgConfidence,
          eyeOpenness,
          landmarks,
        });
      }

      lastFaceDataRef.current = currentData;
      setFaceData(currentData);
      setHistory((prevList) => [...prevList.slice(-59), currentData]);
    } catch (err) {
      console.warn('Detection cycle error:', err);
    }
  }, [videoRef, canvasRef]);

  const start = useCallback(() => {
    if (!intervalIdRef.current) {
      setIsRunning(true);
      intervalIdRef.current = setInterval(detectFrame, DETECT_INTERVAL_MS);
    }
  }, [detectFrame]);

  const stop = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (canvasRef.current) {
      canvasRef.current
        .getContext('2d')
        ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsRunning(false);
  }, [canvasRef]);

  // Handle tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  return {
    modelStatus,
    faceData,
    history,
    isRunning,
    start,
    stop,
    loadModels,
  };
}
