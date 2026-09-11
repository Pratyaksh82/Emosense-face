import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { ActionUnit, MicroExpression } from '../lib/types';
import { getEmotionMeta } from '../lib/emotions';
import { cn } from '../lib/utils';

interface ActionUnitsProps {
  actionUnits: ActionUnit[];
  microExpression: MicroExpression | null;
  faceDetected: boolean;
}

export const ActionUnits: React.FC<ActionUnitsProps> = ({
  actionUnits,
  microExpression,
  faceDetected,
}) => {
  if (!faceDetected) {
    return (
      <p className="text-[11px] text-muted-foreground">No face detected</p>
    );
  }

  const meMeta = microExpression
    ? getEmotionMeta(microExpression.emotion)
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Action Units List */}
      <div className="flex flex-col gap-1.5">
        {actionUnits.map((unit) => (
          <div
            key={unit.au}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition-all duration-300',
              unit.active
                ? 'border-border bg-card/60 shadow-xs'
                : 'border-transparent opacity-40 hover:opacity-60'
            )}
          >
            {/* Status indicator dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
              style={{
                background: unit.active
                  ? `hsl(262 80% 62% / ${0.4 + unit.intensity * 0.6})`
                  : 'hsl(215 20% 30%)',
                boxShadow: unit.active
                  ? '0 0 8px hsl(262 80% 62% / 0.5)'
                  : 'none',
              }}
            />

            {/* AU Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <span className="font-mono text-[10px] text-primary/90 font-medium">
                  {unit.au}
                </span>
                <span className="font-medium text-foreground truncate">
                  {unit.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                  {Math.round(unit.intensity * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/80 truncate leading-tight mt-0.5">
                {unit.clinical}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Micro-expression Flash Alert */}
      <AnimatePresence>
        {microExpression && meMeta && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border shadow-sm"
            style={{
              borderColor: `${meMeta.color}40`,
              background: `${meMeta.color}10`,
            }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
              style={{ background: `${meMeta.color}20`, color: meMeta.color }}
            >
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span>{meMeta.emoji}</span>
                <span>Micro-{meMeta.label}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Transient affect flash ({Math.round(microExpression.intensity * 100)}% intensity)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
