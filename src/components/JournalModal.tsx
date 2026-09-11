import React from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Trash2, Clock, Printer, ChevronRight } from 'lucide-react';
import { SessionSummary } from '../lib/types';
import { getEmotionMeta, getBehavioralMeta } from '../lib/emotions';
import { formatDuration } from '../lib/utils';
import { printClinicalReport } from '../lib/report';

interface JournalModalProps {
  entries: SessionSummary[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  entries,
  onRemove,
  onClearAll,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-2xl max-h-[85vh] mx-auto rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Emotional Journal & History
            </h2>
            <p className="text-xs text-muted-foreground">
              {entries.length} {entries.length === 1 ? 'session' : 'sessions'} recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all journal entries?')) {
                  onClearAll();
                }
              }}
              className="text-xs text-muted-foreground hover:text-destructive px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 p-6 overflow-y-auto space-y-3 min-h-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 border border-border flex items-center justify-center text-muted-foreground">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No sessions recorded yet
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Start camera detection and complete a session to view your affect summaries and clinical notes here.
              </p>
            </div>
          </div>
        ) : (
          entries.map((session) => {
            const emotionMeta = getEmotionMeta(session.dominantEmotion);
            const behavioralMeta = getBehavioralMeta(session.dominantBehavior);

            return (
              <div
                key={session.id}
                className="p-4 rounded-xl border border-border bg-card/60 hover:border-primary/30 transition-all flex flex-col gap-3 shadow-xs"
              >
                {/* Session Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{emotionMeta.emoji}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: emotionMeta.color }}
                    >
                      {emotionMeta.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">·</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {session.dominantEmotionPct}%
                    </span>
                    <span className="text-[11px] text-muted-foreground/60">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      {behavioralMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(session.duration)}</span>
                    </div>
                    <span>·</span>
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Consoling Quote / Observation preview */}
                <p className="text-xs text-foreground/90 leading-relaxed italic">
                  "{session.consolingMessage}"
                </p>

                {/* Metrics Breakdown Mini Bar */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden flex">
                    {session.emotionBreakdown.map((item) => (
                      <div
                        key={item.emotion}
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: getEmotionMeta(item.emotion).color,
                        }}
                        title={`${item.emotion}: ${item.pct}%`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => printClinicalReport(session)}
                    className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium ml-2 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer"
                    title="Print clinical observations report"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Report</span>
                  </button>

                  <button
                    onClick={() => onRemove(session.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
