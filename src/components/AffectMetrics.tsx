import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { AffectMetrics as AffectMetricsType } from '../lib/types';

interface MetricBarProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  color: string;
  formatVal?: (v: number) => string;
}

export function MetricBar({
  label,
  value,
  min = 0,
  max = 1,
  color,
  formatVal,
}: MetricBarProps) {
  const isBidirectional = min < 0;
  const range = max - min;
  const clampedVal = Math.max(min, Math.min(max, value));

  // Compute bar width and position
  let leftPct = 0;
  let widthPct = 0;

  if (isBidirectional) {
    const zeroPct = (-min / range) * 100;
    if (clampedVal >= 0) {
      leftPct = zeroPct;
      widthPct = (clampedVal / range) * 100;
    } else {
      widthPct = (Math.abs(clampedVal) / range) * 100;
      leftPct = zeroPct - widthPct;
    }
  } else {
    leftPct = 0;
    widthPct = ((clampedVal - min) / range) * 100;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums font-mono" style={{ color }}>
          {formatVal ? formatVal(value) : value.toFixed(2)}
        </span>
      </div>

      <div className="relative h-1.5 bg-muted/40 rounded-full overflow-hidden">
        {/* Center line indicator for bidirectional scales */}
        {isBidirectional && (
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-border -translate-x-1/2 z-10" />
        )}
        <motion.div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: `${leftPct}%`,
            width: `${Math.max(2, widthPct)}%`,
            backgroundColor: color,
          }}
          transition={{ duration: 0.25 }}
        />
      </div>
    </div>
  );
}

interface AffectMetricsProps {
  metrics: AffectMetricsType | null;
}

export const AffectMetrics: React.FC<AffectMetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Enable camera to see affect metrics
      </p>
    );
  }

  const valenceColor =
    metrics.valence > 0.1
      ? 'hsl(142 72% 50%)'
      : metrics.valence < -0.1
      ? 'hsl(0 72% 55%)'
      : 'hsl(215 20% 60%)';

  const arousalColor =
    metrics.arousal > 0.2
      ? 'hsl(38 95% 60%)'
      : metrics.arousal < -0.2
      ? 'hsl(220 70% 60%)'
      : 'hsl(215 20% 60%)';

  const variabilityColor =
    metrics.emotionalVariability > 0.5
      ? 'hsl(38 95% 60%)'
      : metrics.emotionalVariability < 0.15
      ? 'hsl(142 72% 50%)'
      : 'hsl(215 20% 60%)';

  const regulationColor =
    metrics.regulationEstimate > 0.65
      ? 'hsl(142 72% 50%)'
      : metrics.regulationEstimate < 0.35
      ? 'hsl(0 72% 55%)'
      : 'hsl(38 95% 60%)';

  return (
    <div className="flex flex-col gap-2.5">
      <MetricBar
        label="Valence"
        value={metrics.valence}
        min={-1}
        max={1}
        color={valenceColor}
        formatVal={(v) => (v >= 0 ? '+' : '') + v.toFixed(2)}
      />
      <MetricBar
        label="Arousal"
        value={metrics.arousal}
        min={-1}
        max={1}
        color={arousalColor}
        formatVal={(v) => (v >= 0 ? '+' : '') + v.toFixed(2)}
      />
      <MetricBar
        label="Affect Intensity"
        value={metrics.affectIntensity}
        min={0}
        max={1}
        color="hsl(262 80% 62%)"
        formatVal={(v) => `${Math.round(v * 100)}%`}
      />
      <MetricBar
        label="Emotional Variability"
        value={metrics.emotionalVariability}
        min={0}
        max={1}
        color={variabilityColor}
        formatVal={(v) => `${Math.round(v * 100)}%`}
      />
      <MetricBar
        label="Regulation Estimate"
        value={metrics.regulationEstimate}
        min={0}
        max={1}
        color={regulationColor}
        formatVal={(v) => `${Math.round(v * 100)}%`}
      />

      {metrics.flatAffect && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 mt-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-400 leading-tight">
            Flat/restricted affect detected
          </p>
        </div>
      )}
    </div>
  );
};
