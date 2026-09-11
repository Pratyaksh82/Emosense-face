import React, { useEffect, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, ArrowLeft, Loader2 } from 'lucide-react';
import { CameraStatus } from '../hooks/useCamera';
import { ModelStatus } from '../hooks/useEmotionDetection';
import { FaceData } from '../lib/types';
import { getEmotionMeta, getBehavioralMeta } from '../lib/emotions';
import { ValenceArousalRadar } from './ValenceArousalRadar';
import { EmotionAnalysis } from './EmotionAnalysis';
import { cn } from '../lib/utils';

interface FocusModeProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cameraStatus: CameraStatus;
  modelStatus: ModelStatus;
  faceData: FaceData | null;
  isRunning: boolean;
  history: FaceData[];
  onToggleCamera: () => void;
  onStartDetection: () => void;
  onStopDetection: () => void;
  onExitFocus: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  videoRef,
  canvasRef,
  cameraStatus,
  modelStatus,
  faceData,
  isRunning,
  history,
  onToggleCamera,
  onStartDetection,
  onStopDetection,
  onExitFocus,
}) => {
  const isCameraActive = cameraStatus === 'active';
  const dominantEmotion = faceData?.dominantEmotion ?? 'neutral';
  const emotionMeta = getEmotionMeta(dominantEmotion);
  const behavioralMeta = getBehavioralMeta(faceData?.behavioralState ?? 'unknown');
  const isDetected = faceData?.faceDetected && isCameraActive;

  useEffect(() => {
    if (isCameraActive && modelStatus === 'ready' && !isRunning) {
      onStartDetection();
    } else if (!isCameraActive && isRunning) {
      onStopDetection();
    }
  }, [isCameraActive, modelStatus, isRunning, onStartDetection, onStopDetection]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-background">
      {/* Dynamic ambient background glow */}
      <AnimatePresence>
        {isDetected && (
          <motion.div
            key={dominantEmotion}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 30% 50%, ${emotionMeta.color}10 0%, transparent 65%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Top Floating Status Strip */}
      {isDetected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-6 px-6 py-2.5 bg-card/60 backdrop-blur-md border-b border-border z-10"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{emotionMeta.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: emotionMeta.color }}>
              {emotionMeta.label}
            </span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono text-[10px]" style={{ color: behavioralMeta.color }}>
              {behavioralMeta.icon}
            </span>
            <span>{behavioralMeta.label}</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="text-xs font-mono text-muted-foreground">
            {Math.round(faceData.confidence * 100)}% Confidence
          </div>
        </motion.div>
      )}

      {/* Main 2-Column Split: Big Camera Left + Deep Analysis Right */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">
        {/* Left Side: Video Viewport & Controls */}
        <div className="flex flex-col items-center justify-center gap-4 p-8 border-r border-border overflow-y-auto">
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden border transition-all duration-700 bg-card shadow-2xl aspect-[4/3]"
            style={{
              borderColor: isDetected ? `${emotionMeta.color}45` : 'hsl(var(--border))',
              boxShadow: isDetected
                ? `0 0 40px ${emotionMeta.color}1a, 0 0 100px ${emotionMeta.color}0a`
                : undefined,
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                'absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500',
                isCameraActive ? 'opacity-100' : 'opacity-0'
              )}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
              style={{
                opacity: faceData?.faceDetected ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center border border-border">
                  <CameraOff className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Camera is disabled in focus mode
                </p>
              </div>
            )}
          </div>

          {/* Bottom Bar Controls */}
          <div className="flex items-center gap-3 w-full max-w-lg">
            <button
              onClick={onExitFocus}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/80 hover:bg-card text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>

            <button
              onClick={onToggleCamera}
              disabled={cameraStatus === 'requesting' || modelStatus === 'loading'}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs',
                isCameraActive
                  ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
                  : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              {cameraStatus === 'requesting' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : isCameraActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Disable Camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Enable Camera</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Deep Valence-Arousal & Emotion Spectrum */}
        <div className="p-8 flex flex-col gap-6 overflow-y-auto max-w-lg mx-auto w-full">
          <div>
            <h3 className="text-sm font-semibold mb-1">
              Valence-Arousal Coordinate Space
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Circumplex model plotting real-time affect trajectory
            </p>
            <div className="max-w-xs mx-auto">
              <ValenceArousalRadar faceData={faceData} history={history} />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-3">Live Emotion Probabilities</h3>
            <EmotionAnalysis faceData={faceData} isRunning={isRunning} />
          </div>
        </div>
      </div>
    </div>
  );
};
