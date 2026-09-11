import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, X } from 'lucide-react';

interface ReminderBannerProps {
  visible: boolean;
  daysSinceLast: number | null;
  onStartSession: () => void;
  onDismiss: () => void;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  visible,
  daysSinceLast,
  onStartSession,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-40 max-w-sm p-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/40 shadow-2xl flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Bell className="w-4 h-4" />
              <span className="text-xs font-semibold">Gentle Check-in</span>
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-foreground/90 leading-relaxed">
            {daysSinceLast && daysSinceLast > 1
              ? `It's been ${daysSinceLast} days since your last reflection session. Taking 2 minutes to check in can help ground your day.`
              : 'Taking a quick moment to check in with your expressions and feelings can help ground your day.'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onStartSession}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Session</span>
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
