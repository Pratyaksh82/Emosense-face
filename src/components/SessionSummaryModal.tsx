import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  BookOpen,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SessionSummary, SeverityLevel } from '../lib/types';
import { getEmotionMeta, getBehavioralMeta } from '../lib/emotions';
import { formatDuration, cn } from '../lib/utils';
import { printClinicalReport } from '../lib/report';

interface SessionSummaryModalProps {
  summary: SessionSummary;
  onDismiss: () => void;
  onNewSession: () => void;
  onViewJournal: () => void;
}

const SEVERITY_ICONS: Record<SeverityLevel, string> = {
  positive: '✨',
  neutral: '🌿',
  concerning: '💙',
  distressed: '🫂',
};

const SEVERITY_STYLES: Record<
  SeverityLevel,
  { border: string; headerBg: string; glow: string }
> = {
  positive: {
    border: 'border-amber-500/30',
    headerBg: 'bg-amber-500/5',
    glow: 'shadow-[0_0_50px_hsl(38_95%_60%/0.12)]',
  },
  neutral: {
    border: 'border-emerald-500/20',
    headerBg: 'bg-emerald-500/5',
    glow: 'shadow-[0_0_40px_hsl(142_72%_50%/0.08)]',
  },
  concerning: {
    border: 'border-sky-400/30',
    headerBg: 'bg-sky-400/5',
    glow: 'shadow-[0_0_50px_hsl(196_75%_55%/0.12)]',
  },
  distressed: {
    border: 'border-violet-500/30',
    headerBg: 'bg-violet-500/6',
    glow: 'shadow-[0_0_60px_hsl(262_80%_62%/0.15)]',
  },
};

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  summary,
  onDismiss,
  onNewSession,
  onViewJournal,
}) => {
  const [showClinicalReport, setShowClinicalReport] = useState(false);
  const emotionMeta = getEmotionMeta(summary.dominantEmotion);
  const behavioralMeta = getBehavioralMeta(summary.dominantBehavior);
  const severityStyle = SEVERITY_STYLES[summary.severityLevel];

  // Confetti on positive sessions
  useEffect(() => {
    if (summary.severityLevel === 'positive') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#8b5cf6'],
      });
    }
  }, [summary.severityLevel]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={cn(
        'w-full max-w-md mx-auto rounded-2xl border bg-card/95 backdrop-blur-xl overflow-hidden shadow-2xl z-30',
        severityStyle.border,
        severityStyle.glow
      )}
    >
      {/* Header */}
      <div className={cn('px-6 pt-6 pb-4 relative', severityStyle.headerBg)}>
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl select-none">
            {SEVERITY_ICONS[summary.severityLevel]}
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Session Complete</h2>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(summary.duration)}</span>
              <span className="text-muted-foreground/40 mx-0.5">·</span>
              <span>
                {new Date(summary.date).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Consoling message */}
        <p className="text-xs text-foreground/90 leading-relaxed mt-2">
          {summary.consolingMessage}
        </p>
      </div>

      {/* Body Details */}
      <div className="p-6 flex flex-col gap-4">
        {/* Dominant mood & behavior tags */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-xs"
            style={{
              borderColor: `${emotionMeta.color}40`,
              background: `${emotionMeta.color}15`,
              color: emotionMeta.color,
            }}
          >
            <span>{emotionMeta.emoji}</span>
            <span>
              {emotionMeta.label} ({summary.dominantEmotionPct}%)
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium bg-muted/40 border-border shadow-xs"
            style={{ color: behavioralMeta.color }}
          >
            <span className="font-mono text-[10px]">{behavioralMeta.icon}</span>
            <span>{behavioralMeta.label}</span>
          </div>
        </div>

        {/* Emotion breakdown horizontal bars */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-card border border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Primary Expressions Recorded
          </p>
          <div className="flex flex-col gap-2">
            {summary.emotionBreakdown.map(({ emotion, pct }) => {
              const meta = getEmotionMeta(emotion);
              return (
                <div key={emotion} className="flex items-center gap-2 text-xs">
                  <span className="text-xs w-4 leading-none text-center">
                    {meta.emoji}
                  </span>
                  <span className="text-[11px] w-16 text-muted-foreground capitalize truncate">
                    {meta.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums font-mono text-muted-foreground w-7 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical observations accordion toggle */}
        <div className="border border-border/80 rounded-xl overflow-hidden bg-card/40">
          <button
            onClick={() => setShowClinicalReport((prev) => !prev)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-primary font-bold">Clinical Metrics & Notes</span>
            </span>
            {showClinicalReport ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {showClinicalReport && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 pt-1 text-xs border-t border-border/60 flex flex-col gap-3"
              >
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2 rounded-lg bg-background border border-border">
                    <div className="text-[10px] text-muted-foreground">Avg Valence</div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5">
                      {summary.psychReport.avgValence >= 0 ? '+' : ''}
                      {summary.psychReport.avgValence.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border">
                    <div className="text-[10px] text-muted-foreground">Avg Arousal</div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5">
                      {summary.psychReport.avgArousal >= 0 ? '+' : ''}
                      {summary.psychReport.avgArousal.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-background border border-border">
                    <div className="text-[10px] text-muted-foreground">Variability</div>
                    <div className="text-xs font-bold font-mono text-foreground mt-0.5">
                      {(summary.psychReport.emotionalVariability * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Clinical observation bullets */}
                <div className="space-y-1.5 mt-1">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Observations:
                  </div>
                  <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
                    {summary.psychReport.clinicalObservations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Print button */}
                <button
                  onClick={() => printClinicalReport(summary)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border hover:border-primary/40 bg-card text-[11px] font-medium text-foreground transition-all mt-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  <span>Print Full Clinical Report</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Closing note */}
        <p className="text-xs text-muted-foreground leading-relaxed italic px-1">
          {summary.closingNote}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={onViewJournal}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card/80 hover:bg-card text-xs font-medium text-foreground transition-all cursor-pointer shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span>View Journal</span>
          </button>
          <button
            onClick={onNewSession}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
