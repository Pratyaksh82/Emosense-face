import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, BookOpen, Maximize2, LayoutDashboard } from 'lucide-react';
import { ModelStatus } from '../hooks/useEmotionDetection';
import { FaceData } from '../lib/types';
import { getEmotionMeta } from '../lib/emotions';
import { cn } from '../lib/utils';

interface HeaderProps {
  cameraActive: boolean;
  modelStatus: ModelStatus;
  faceData: FaceData | null;
  focusMode: boolean;
  journalOpen: boolean;
  journalCount: number;
  onToggleFocus: () => void;
  onToggleJournal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cameraActive,
  modelStatus,
  faceData,
  focusMode,
  journalOpen,
  journalCount,
  onToggleFocus,
  onToggleJournal,
}) => {
  const isDetected = cameraActive && faceData?.faceDetected;
  const emotionMeta = getEmotionMeta(faceData?.dominantEmotion ?? 'neutral');

  return (
    <header className="relative z-20 flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/60 backdrop-blur-md sticky top-0">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-700 shadow-sm"
          style={
            isDetected
              ? {
                  background: `${emotionMeta.color}18`,
                  borderColor: `${emotionMeta.color}40`,
                  boxShadow: `0 0 15px -3px ${emotionMeta.color}30`,
                }
              : {
                  background: 'hsl(262 80% 62% / 0.12)',
                  borderColor: 'hsl(262 80% 62% / 0.25)',
                }
          }
        >
          <BrainCircuit
            className="w-4 h-4 transition-all duration-700"
            style={{
              color: isDetected ? emotionMeta.color : 'hsl(262 80% 62%)',
            }}
          />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight leading-tight">
            EmoSense AI
          </h1>
          <p className="text-[11px] text-muted-foreground">Emotion-aware support</p>
        </div>
      </div>

      {/* Center/Right Status & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Dominant emotion pill */}
        <AnimatePresence mode="wait">
          {isDetected && (
            <motion.div
              key={emotionMeta.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shadow-xs"
              style={{
                background: `${emotionMeta.color}15`,
                borderColor: `${emotionMeta.color}35`,
                color: emotionMeta.color,
              }}
            >
              <span>{emotionMeta.emoji}</span>
              <span className="font-medium">{emotionMeta.label}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Model Status */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all',
            modelStatus === 'ready'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : modelStatus === 'loading'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : modelStatus === 'error'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-muted/40 border-border text-muted-foreground'
          )}
        >
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              modelStatus === 'ready'
                ? 'bg-emerald-400 animate-pulse'
                : modelStatus === 'loading'
                ? 'bg-amber-400 animate-pulse'
                : modelStatus === 'error'
                ? 'bg-rose-400'
                : 'bg-muted-foreground'
            )}
          />
          <span className="font-medium text-[11px]">
            {modelStatus === 'ready'
              ? 'AI Ready'
              : modelStatus === 'loading'
              ? 'Loading Models...'
              : modelStatus === 'error'
              ? 'Model Error'
              : 'Initialising'}
          </span>
        </div>

        {/* Journal Trigger Button */}
        <button
          onClick={onToggleJournal}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 relative cursor-pointer',
            journalOpen
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-card/80 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
          title="Open session journal and history"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="font-medium">Journal</span>
          {journalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              {journalCount > 9 ? '9+' : journalCount}
            </span>
          )}
        </button>

        {/* Focus Mode Toggle */}
        <button
          onClick={onToggleFocus}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer',
            focusMode
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-card/80 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
        >
          {focusMode ? (
            <>
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="font-medium">Dashboard</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="font-medium">Focus Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
