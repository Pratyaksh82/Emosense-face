import React, { useMemo, useState } from 'react';
import { FaceData } from '../lib/types';

interface MoodHistoryProps {
  history: FaceData[];
}

const TRACKED_EMOTIONS = [
  { key: 'happy' as const, label: 'Happy', color: 'hsl(38 95% 60%)' },
  { key: 'neutral' as const, label: 'Neutral', color: 'hsl(215 20% 65%)' },
  { key: 'sad' as const, label: 'Sad', color: 'hsl(196 75% 55%)' },
  { key: 'angry' as const, label: 'Tense', color: 'hsl(0 72% 51%)' },
];

export const MoodHistory: React.FC<MoodHistoryProps> = ({ history }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const samples = useMemo(() => {
    return history.slice(-30).map((frame, idx) => ({
      index: idx,
      happy: Math.round((frame.emotionScores.happy ?? 0) * 100),
      neutral: Math.round((frame.emotionScores.neutral ?? 0) * 100),
      sad: Math.round((frame.emotionScores.sad ?? 0) * 100),
      angry: Math.round((frame.emotionScores.angry ?? 0) * 100),
    }));
  }, [history]);

  if (samples.length < 3) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
        Collecting samples ({samples.length}/3 frames)...
      </div>
    );
  }

  const width = 260;
  const height = 120;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 12;
  const paddingBottom = 16;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Helper to generate SVG polyline path
  const getCoordinates = (key: 'happy' | 'neutral' | 'sad' | 'angry') => {
    return samples.map((sample, i) => {
      const x = paddingLeft + (i / (samples.length - 1)) * plotWidth;
      const y = paddingTop + plotHeight - (sample[key] / 100) * plotHeight;
      return { x, y };
    });
  };

  const getPath = (coords: { x: number; y: number }[]) => {
    return coords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  };

  const hoveredSample = hoverIndex !== null ? samples[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="relative rounded-xl overflow-hidden border border-border bg-card/40 p-2 shadow-inner cursor-crosshair"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const idx = Math.round(relX * (samples.length - 1));
            setHoverIndex(Math.max(0, Math.min(samples.length - 1, idx)));
          }}
        >
          {/* Horizontal grid guide lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = paddingTop + plotHeight - (val / 100) * plotHeight;
            return (
              <line
                key={val}
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="hsl(216 34% 17%)"
                strokeDasharray="2 3"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Lines for each emotion */}
          {TRACKED_EMOTIONS.map(({ key, color }) => {
            const coords = getCoordinates(key);
            const pathData = getPath(coords);
            return (
              <g key={key}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.85}
                />
              </g>
            );
          })}

          {/* Hover crosshair & dots */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={paddingLeft + (hoverIndex / (samples.length - 1)) * plotWidth}
                y1={paddingTop}
                x2={paddingLeft + (hoverIndex / (samples.length - 1)) * plotWidth}
                y2={height - paddingBottom}
                stroke="hsl(215 20% 50%)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {TRACKED_EMOTIONS.map(({ key, color }) => {
                const coords = getCoordinates(key);
                const pt = coords[hoverIndex];
                return (
                  <circle
                    key={key}
                    cx={pt.x}
                    cy={pt.y}
                    r={3}
                    fill={color}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hovered stats tooltip */}
        {hoveredSample && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-md px-2 py-1 rounded-md border border-border text-[10px] font-mono flex gap-2 shadow-xs">
            {TRACKED_EMOTIONS.map(({ key, color }) => (
              <span key={key} style={{ color }}>
                {hoveredSample[key]}%
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
        {TRACKED_EMOTIONS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
