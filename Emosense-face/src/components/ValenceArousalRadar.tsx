import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaceData } from '../lib/types';
import {
  calculateValence,
  calculateArousal,
  classifyAffectQuadrant,
  toRadarCoordinates,
  RADAR_SIZE,
  RADAR_CENTER_X,
  RADAR_CENTER_Y,
  RADAR_SCALE,
} from '../lib/affect';

interface ValenceArousalRadarProps {
  faceData: FaceData | null;
  history: FaceData[];
}

export const ValenceArousalRadar: React.FC<ValenceArousalRadarProps> = ({
  faceData,
  history,
}) => {
  const currentPos = useMemo(() => {
    if (!faceData?.faceDetected) return null;
    const v = calculateValence(faceData.emotionScores);
    const a = calculateArousal(faceData.emotionScores);
    return {
      v,
      a,
      ...toRadarCoordinates(v, a),
    };
  }, [faceData?.emotionScores, faceData?.faceDetected]);

  const trail = useMemo(() => {
    return history
      .filter((h) => h.faceDetected)
      .slice(-16)
      .map((h) => {
        const v = calculateValence(h.emotionScores);
        const a = calculateArousal(h.emotionScores);
        return {
          v,
          a,
          ...toRadarCoordinates(v, a),
        };
      });
  }, [history]);

  const affectLabel = currentPos
    ? classifyAffectQuadrant(currentPos.v, currentPos.a)
    : null;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative rounded-xl overflow-hidden border border-border bg-card/30 shadow-inner"
        style={{ width: '100%', aspectRatio: '1' }}
      >
        <svg
          viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
          width="100%"
          height="100%"
          className="block select-none"
        >
          <defs>
            <radialGradient id="q-excited" cx="75%" cy="25%" r="60%">
              <stop offset="0%" stopColor="hsl(38 95% 60%)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(38 95% 60%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="q-anxious" cx="25%" cy="25%" r="60%">
              <stop offset="0%" stopColor="hsl(0 72% 55%)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(0 72% 55%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="q-content" cx="75%" cy="75%" r="60%">
              <stop offset="0%" stopColor="hsl(142 72% 50%)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(142 72% 50%)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="q-sad" cx="25%" cy="75%" r="60%">
              <stop offset="0%" stopColor="hsl(220 70% 60%)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(220 70% 60%)" stopOpacity="0" />
            </radialGradient>
            <clipPath id="circle-clip">
              <circle
                cx={RADAR_CENTER_X}
                cy={RADAR_CENTER_Y}
                r={RADAR_SCALE + 2}
              />
            </clipPath>
          </defs>

          {/* Base Circle Background */}
          <circle
            cx={RADAR_CENTER_X}
            cy={RADAR_CENTER_Y}
            r={RADAR_SCALE + 2}
            fill="hsl(222 47% 7%)"
          />

          {/* Quadrant color glows */}
          <g clipPath="url(#circle-clip)">
            <rect x="0" y="0" width={RADAR_SIZE} height={RADAR_SIZE} fill="url(#q-excited)" />
            <rect x="0" y="0" width={RADAR_SIZE} height={RADAR_SIZE} fill="url(#q-anxious)" />
            <rect x="0" y="0" width={RADAR_SIZE} height={RADAR_SIZE} fill="url(#q-content)" />
            <rect x="0" y="0" width={RADAR_SIZE} height={RADAR_SIZE} fill="url(#q-sad)" />
          </g>

          {/* Outer Border */}
          <circle
            cx={RADAR_CENTER_X}
            cy={RADAR_CENTER_Y}
            r={RADAR_SCALE + 2}
            fill="none"
            stroke="hsl(216 34% 17%)"
            strokeWidth="1"
          />

          {/* Concentric rings */}
          {[0.33, 0.66].map((ratio) => (
            <circle
              key={ratio}
              cx={RADAR_CENTER_X}
              cy={RADAR_CENTER_Y}
              r={RADAR_SCALE * ratio}
              fill="none"
              stroke="hsl(216 34% 17%)"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
          ))}

          {/* Crosshair Axes */}
          <line
            x1={RADAR_CENTER_X - RADAR_SCALE}
            y1={RADAR_CENTER_Y}
            x2={RADAR_CENTER_X + RADAR_SCALE}
            y2={RADAR_CENTER_Y}
            stroke="hsl(215 20% 28%)"
            strokeWidth="0.8"
          />
          <line
            x1={RADAR_CENTER_X}
            y1={RADAR_CENTER_Y - RADAR_SCALE}
            x2={RADAR_CENTER_X}
            y2={RADAR_CENTER_Y + RADAR_SCALE}
            stroke="hsl(215 20% 28%)"
            strokeWidth="0.8"
          />

          {/* Axis Labels */}
          <text
            x={RADAR_CENTER_X + RADAR_SCALE - 4}
            y={RADAR_CENTER_Y - 4}
            textAnchor="end"
            fontSize="7"
            fill="hsl(215 20% 40%)"
            fontFamily="system-ui"
          >
            +valence
          </text>
          <text
            x={RADAR_CENTER_X - RADAR_SCALE + 4}
            y={RADAR_CENTER_Y - 4}
            textAnchor="start"
            fontSize="7"
            fill="hsl(215 20% 40%)"
            fontFamily="system-ui"
          >
            −valence
          </text>
          <text
            x={RADAR_CENTER_X + 3}
            y={RADAR_CENTER_Y - RADAR_SCALE + 9}
            textAnchor="start"
            fontSize="7"
            fill="hsl(215 20% 40%)"
            fontFamily="system-ui"
          >
            +arousal
          </text>
          <text
            x={RADAR_CENTER_X + 3}
            y={RADAR_CENTER_Y + RADAR_SCALE - 3}
            textAnchor="start"
            fontSize="7"
            fill="hsl(215 20% 40%)"
            fontFamily="system-ui"
          >
            −arousal
          </text>

          {/* Quadrant Names */}
          <text
            x={RADAR_CENTER_X + 8}
            y={RADAR_CENTER_Y - RADAR_SCALE + 20}
            fontSize="7.5"
            fill="hsl(38 95% 60% / 0.7)"
            fontFamily="system-ui"
            fontWeight="600"
          >
            Excited
          </text>
          <text
            x={RADAR_CENTER_X - 8}
            y={RADAR_CENTER_Y - RADAR_SCALE + 20}
            fontSize="7.5"
            fill="hsl(0 72% 55% / 0.7)"
            fontFamily="system-ui"
            fontWeight="600"
            textAnchor="end"
          >
            Anxious
          </text>
          <text
            x={RADAR_CENTER_X + 8}
            y={RADAR_CENTER_Y + RADAR_SCALE - 10}
            fontSize="7.5"
            fill="hsl(142 72% 50% / 0.7)"
            fontFamily="system-ui"
            fontWeight="600"
          >
            Content
          </text>
          <text
            x={RADAR_CENTER_X - 8}
            y={RADAR_CENTER_Y + RADAR_SCALE - 10}
            fontSize="7.5"
            fill="hsl(220 70% 60% / 0.7)"
            fontFamily="system-ui"
            fontWeight="600"
            textAnchor="end"
          >
            Sad
          </text>

          {/* Trail Points */}
          {trail.length > 1 &&
            trail.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={2}
                fill={affectLabel?.color ?? 'hsl(262 80% 62%)'}
                opacity={0.08 + (idx / trail.length) * 0.35}
              />
            ))}

          {/* Trail Line */}
          {trail.length > 1 && (
            <polyline
              points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={affectLabel?.color ?? 'hsl(262 80% 62%)'}
              strokeWidth="1"
              strokeOpacity="0.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current Affect Point */}
          {currentPos ? (
            <>
              <circle
                cx={currentPos.x}
                cy={currentPos.y}
                r={8}
                fill={affectLabel?.color ?? 'hsl(262 80% 62%)'}
                opacity="0.2"
              />
              <motion.circle
                cx={currentPos.x}
                cy={currentPos.y}
                r={4.5}
                fill={affectLabel?.color ?? 'hsl(262 80% 62%)'}
                stroke="white"
                strokeWidth="1.2"
                initial={false}
                animate={{ cx: currentPos.x, cy: currentPos.y }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              />
            </>
          ) : (
            <circle
              cx={RADAR_CENTER_X}
              cy={RADAR_CENTER_Y}
              r={3.5}
              fill="hsl(215 20% 35%)"
              opacity="0.5"
            />
          )}
        </svg>
      </div>

      {/* Affect quadrant status card */}
      {affectLabel ? (
        <div className="flex flex-col gap-0.5 px-1">
          <p className="text-[11px] font-semibold" style={{ color: affectLabel.color }}>
            {affectLabel.label}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {affectLabel.clinical}
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground px-1">
          Enable camera to plot affect position
        </p>
      )}
    </div>
  );
};
