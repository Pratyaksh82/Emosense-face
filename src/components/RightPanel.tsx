import React, { useMemo } from 'react';
import { Activity, Compass, Cpu, Clock } from 'lucide-react';
import { FaceData } from '../lib/types';
import { computeAffectMetrics } from '../lib/affect';
import { ValenceArousalRadar } from './ValenceArousalRadar';
import { AffectMetrics } from './AffectMetrics';
import { ActionUnits } from './ActionUnits';
import { MoodHistory } from './MoodHistory';

interface RightPanelProps {
  faceData: FaceData | null;
  history: FaceData[];
}

const LIMITATIONS = [
  'Not a medical or psychological diagnostic tool',
  'Emotion classification is approximate and contextual',
  'Works best in even, forward-facing lighting',
  'Designed for personal insight and supportive interaction',
];

export const RightPanel: React.FC<RightPanelProps> = ({ faceData, history }) => {
  const metrics = useMemo(() => {
    return faceData?.faceDetected
      ? computeAffectMetrics(faceData, history)
      : null;
  }, [faceData, history]);

  return (
    <aside className="flex flex-col border-l border-border bg-card/20 p-4 overflow-y-auto gap-4">
      {/* Mood History */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-primary/70" />
          Mood History (last minute)
        </p>
        <MoodHistory history={history} />
      </div>

      {/* Valence-Arousal Circumplex Radar */}
      <div className="border-t border-border pt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2.5 flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-primary/70" />
          Valence-Arousal Space
        </p>
        <ValenceArousalRadar faceData={faceData} history={history} />
      </div>

      {/* Affect Metrics */}
      <div className="border-t border-border pt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-primary/70" />
          Affect Metrics
        </p>
        <AffectMetrics metrics={metrics} />
      </div>

      {/* FACS Action Units & Micro-expressions */}
      <div className="border-t border-border pt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2.5 flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-primary/70" />
          Action Units (FACS)
        </p>
        <ActionUnits
          actionUnits={metrics?.actionUnits ?? []}
          microExpression={metrics?.microExpression ?? null}
          faceDetected={Boolean(faceData?.faceDetected)}
        />
      </div>

      {/* Limitations note */}
      <div className="border-t border-border pt-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
          Limitations
        </p>
        <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          {LIMITATIONS.map((text, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-primary/70 mt-0.5">•</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
