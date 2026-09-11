import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceData, EmotionType, ConfidenceLevel } from '../lib/types';
import { getEmotionMeta, getBehavioralMeta } from '../lib/emotions';
import { cn } from '../lib/utils';

interface EmotionAnalysisProps {
  faceData: FaceData | null;
  isRunning: boolean;
}

const ORDERED_EMOTIONS: EmotionType[] = [
  'happy',
  'neutral',
  'sad',
  'angry',
  'fearful',
  'disgusted',
  'surprised',
];

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const meta = {
    uncertain: {
      label: 'Uncertain',
      color: 'text-muted-foreground',
      bg: 'bg-muted/40',
    },
    moderate: {
      label: 'Moderate',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    high: {
      label: 'High',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  }[level];

  return (
    <span
      className={cn(
        'text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider',
        meta.color,
        meta.bg
      )}
    >
      {meta.label}
    </span>
  );
}

function EyeOpennessBar({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color =
    percent < 25
      ? 'hsl(196 75% 55%)'
      : percent < 50
      ? 'hsl(38 95% 60%)'
      : 'hsl(142 72% 50%)';
  const label =
    percent < 25
      ? 'Very low'
      : percent < 50
      ? 'Low'
      : percent < 75
      ? 'Normal'
      : 'Open';

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-card border border-border shadow-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Eye Openness</span>
        <span className="font-semibold text-[11px]" style={{ color }}>
          {label} ({percent}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}

export const EmotionAnalysis: React.FC<EmotionAnalysisProps> = ({
  faceData,
  isRunning,
}) => {
  if (!isRunning && !faceData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="text-4xl opacity-40">🌀</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enable camera to start detection
        </p>
      </div>
    );
  }

  if (!faceData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Initialising analyzer...</p>
      </div>
    );
  }

  const emotionMeta = getEmotionMeta(faceData.dominantEmotion);
  const behavioralMeta = getBehavioralMeta(faceData.behavioralState);
  const trendLabels: Record<string, { label: string; icon: string; color: string }> = {
    stable: { label: 'Stable', icon: '→', color: 'hsl(142 72% 50%)' },
    declining_mood: { label: 'Declining', icon: '↘', color: 'hsl(0 72% 51%)' },
    improving_mood: { label: 'Improving', icon: '↗', color: 'hsl(142 72% 50%)' },
    unstable_mood: { label: 'Fluctuating', icon: '↕', color: 'hsl(38 95% 60%)' },
    suppressed_emotion: { label: 'Suppressed', icon: '~', color: 'hsl(262 80% 62%)' },
    unknown: { label: 'Analysing...', icon: '•', color: 'hsl(215 20% 55%)' },
  };
  const trend = trendLabels[faceData.emotionTrend] ?? trendLabels.unknown;
  const scores = faceData.emotionScores;

  return (
    <div className="flex flex-col gap-3">
      {/* Active Dominant Emotion Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={faceData.dominantEmotion}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 p-3.5 rounded-xl bg-card border transition-all duration-500 shadow-xs"
          style={{
            borderColor: faceData.faceDetected
              ? `${emotionMeta.color}35`
              : 'hsl(var(--border))',
            boxShadow: faceData.faceDetected
              ? `0 0 16px ${emotionMeta.color}10`
              : undefined,
          }}
        >
          <div className="text-3xl leading-none">{emotionMeta.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight" style={{ color: emotionMeta.color }}>
              {emotionMeta.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
              {faceData.faceDetected
                ? emotionMeta.hint
                : 'Position face in camera to calibrate'}
            </p>
          </div>
          {faceData.faceDetected && (
            <ConfidenceBadge level={faceData.confidenceLevel} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Trend & State 2-Column Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Trend
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-base font-bold leading-none"
              style={{ color: trend.color }}
            >
              {trend.icon}
            </span>
            <span className="text-xs font-semibold" style={{ color: trend.color }}>
              {trend.label}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 p-3 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            State
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-xs font-mono"
              style={{ color: behavioralMeta.color }}
            >
              {behavioralMeta.icon}
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: behavioralMeta.color }}
            >
              {behavioralMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Eye Openness */}
      {faceData.faceDetected && <EyeOpennessBar value={faceData.eyeOpenness} />}

      {/* Emotion Probabilities Bars */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-card border border-border shadow-xs">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Probabilities
        </p>
        <div className="flex flex-col gap-2">
          {ORDERED_EMOTIONS.map((emotionKey) => {
            const meta = getEmotionMeta(emotionKey);
            const score = scores[emotionKey] ?? 0;
            const isTop =
              faceData.dominantEmotion === emotionKey && faceData.faceDetected;

            return (
              <div key={emotionKey} className="flex items-center gap-2">
                <span className="text-sm w-4 leading-none text-center">
                  {meta.emoji}
                </span>
                <span
                  className={cn(
                    'text-[11px] w-16 capitalize truncate',
                    isTop ? 'font-semibold' : 'text-muted-foreground'
                  )}
                  style={isTop ? { color: meta.color } : undefined}
                >
                  {meta.label}
                </span>
                <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(score * 100)}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[11px] tabular-nums w-8 text-right text-muted-foreground font-mono">
                  {Math.round(score * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span>Conf: {Math.round(faceData.confidence * 100)}%</span>
        <span
          className={cn(
            'flex items-center gap-1 font-medium',
            faceData.faceDetected ? 'text-emerald-400' : 'text-muted-foreground'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              faceData.faceDetected
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-muted-foreground'
            )}
          />
          {faceData.faceDetected ? 'Face detected' : 'No face'}
        </span>
      </div>
    </div>
  );
};
