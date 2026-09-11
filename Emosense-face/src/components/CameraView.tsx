import React, { useEffect, RefObject } from 'react';
import { Camera, CameraOff, Loader2, Shield, PlayCircle, HelpCircle } from 'lucide-react';
import { CameraStatus } from '../hooks/useCamera';
import { ModelStatus } from '../hooks/useEmotionDetection';
import { FaceData } from '../lib/types';
import { getEmotionMeta, getBehavioralMeta } from '../lib/emotions';
import { cn } from '../lib/utils';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cameraStatus: CameraStatus;
  cameraError?: string | null;
  isDemoMode?: boolean;
  modelStatus: ModelStatus;
  faceData: FaceData | null;
  isRunning: boolean;
  onToggle: () => void;
  onStartDemo: () => void;
  onStartDetection: () => void;
  onStopDetection: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  canvasRef,
  cameraStatus,
  cameraError,
  isDemoMode = false,
  modelStatus,
  faceData,
  isRunning,
  onToggle,
  onStartDemo,
  onStartDetection,
  onStopDetection,
}) => {
  const isCameraActive = cameraStatus === 'active';
  const dominantEmotion = faceData?.dominantEmotion ?? 'neutral';
  const emotionMeta = getEmotionMeta(dominantEmotion);
  const behavioralMeta = getBehavioralMeta(faceData?.behavioralState ?? 'unknown');

  // Automatically start/stop detection when camera and models are ready
  useEffect(() => {
    if (isCameraActive && modelStatus === 'ready' && !isRunning) {
      onStartDetection();
    } else if (!isCameraActive && isRunning) {
      onStopDetection();
    }
  }, [isCameraActive, modelStatus, isRunning, onStartDetection, onStopDetection]);

  return (
    <div className="flex flex-col gap-3">
      {/* Video Viewport Card */}
      <div
        className="relative rounded-2xl overflow-hidden border transition-all duration-700 bg-card aspect-[4/3] shadow-inner"
        style={{
          borderColor:
            isCameraActive && faceData?.faceDetected
              ? `${emotionMeta.color}45`
              : 'hsl(var(--border))',
          boxShadow:
            isCameraActive && faceData?.faceDetected
              ? `0 0 25px ${emotionMeta.color}1a, 0 0 60px ${emotionMeta.color}0a`
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

        {/* Camera Inactive Placeholder */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/90">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center border border-border">
              <CameraOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Camera is off</p>
          </div>
        )}

        {/* Face detected overlays */}
        {isCameraActive && faceData?.faceDetected && (
          <>
            {/* Top-left emotion pill */}
            <div className="absolute top-3 left-3 z-10">
              <div
                className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs"
                style={{
                  borderColor: `${emotionMeta.color}50`,
                  color: emotionMeta.color,
                }}
              >
                <span className="text-sm leading-none">{emotionMeta.emoji}</span>
                <span>{emotionMeta.label}</span>
              </div>
            </div>

            {/* Bottom-left behavioral state */}
            <div className="absolute bottom-3 left-3 z-10">
              <div
                className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border text-[11px] shadow-xs"
                style={{
                  borderColor: `${behavioralMeta.color}40`,
                  color: behavioralMeta.color,
                }}
              >
                <span className="font-mono text-[10px]">{behavioralMeta.icon}</span>
                <span className="font-medium">{behavioralMeta.label}</span>
              </div>
            </div>

            {/* Bottom-right confidence */}
            <div className="absolute bottom-3 right-3 z-10">
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-white/70 font-mono tabular-nums shadow-xs">
                {Math.round(faceData.confidence * 100)}%
              </div>
            </div>
          </>
        )}

        {/* Camera active but no face detected */}
        {isCameraActive && !faceData?.faceDetected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div
              className="w-28 h-36 rounded-2xl border-2 border-dashed opacity-40 animate-pulse"
              style={{ borderColor: 'hsl(215 20% 55%)' }}
            />
            <p className="text-xs text-muted-foreground mt-3 bg-card/80 backdrop-blur-md px-3 py-1 rounded-full border border-border shadow-xs">
              Position face in frame
            </p>
          </div>
        )}

        {/* Live / Demo indicator badge */}
        {isRunning && isCameraActive && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-xs">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full animate-pulse',
                  isDemoMode ? 'bg-amber-400' : 'bg-rose-500'
                )}
              />
              <span className="text-[10px] font-bold tracking-wider text-white/80">
                {isDemoMode ? 'DEMO FEED' : 'LIVE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onToggle}
          disabled={cameraStatus === 'requesting' || modelStatus === 'loading'}
          className={cn(
            'flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border cursor-pointer shadow-xs',
            isCameraActive && !isDemoMode
              ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
              : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
            (cameraStatus === 'requesting' || modelStatus === 'loading') &&
              'opacity-60 cursor-not-allowed'
          )}
        >
          {cameraStatus === 'requesting' && !isDemoMode ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {modelStatus === 'loading'
                  ? 'Loading AI Models...'
                  : 'Starting Camera...'}
              </span>
            </>
          ) : isCameraActive && !isDemoMode ? (
            <>
              <CameraOff className="w-4 h-4" />
              <span>Disable Camera</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Enable Camera</span>
            </>
          )}
        </button>

        {/* Demo Simulation Button */}
        {!isCameraActive && (
          <button
            onClick={onStartDemo}
            disabled={modelStatus === 'loading'}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-border bg-card/60 hover:bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
          >
            <PlayCircle className="w-3.5 h-3.5 text-primary/80" />
            <span>Try Demo Face Mode (No Webcam Required)</span>
          </button>
        )}
      </div>

      {/* Error & Troubleshooting Tips */}
      {cameraStatus === 'error' && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex flex-col gap-2">
          <p className="font-semibold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Webcam Access Issue</span>
          </p>
          <p className="leading-relaxed text-[11px] text-destructive/90">
            {cameraError}
          </p>
          <div className="text-[10px] text-muted-foreground border-t border-destructive/20 pt-2 space-y-1">
            <p className="font-semibold text-foreground/80">How to unlock ASUS webcams:</p>
            <p>1. Press <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">F10</kbd> or <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">Fn + F10</kbd> to unlock the hardware switch.</p>
            <p>2. Check for a physical slider shutter on top of your laptop screen.</p>
            <p>3. Close other browser tabs (e.g. Replit) or video apps using the camera.</p>
          </div>
        </div>
      )}

      {/* Privacy Guarantee Card */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground leading-relaxed">
        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-primary/80" />
        <span>Camera processing runs locally. No images are stored or sent anywhere.</span>
      </div>
    </div>
  );
};
