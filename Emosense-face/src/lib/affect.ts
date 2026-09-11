import {
  EmotionScores,
  FaceData,
  AffectMetrics,
  AffectLabel,
  ActionUnit,
  MicroExpression,
} from './types';

export const VALENCE_WEIGHTS: Record<string, number> = {
  happy: 0.9,
  surprised: 0.2,
  neutral: 0.0,
  fearful: -0.75,
  angry: -0.85,
  disgusted: -0.8,
  sad: -0.85,
};

export const AROUSAL_WEIGHTS: Record<string, number> = {
  happy: 0.6,
  surprised: 0.9,
  neutral: 0.0,
  fearful: 0.85,
  angry: 0.85,
  disgusted: 0.3,
  sad: -0.45,
};

export function calculateValence(scores: EmotionScores): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    weightedSum += (VALENCE_WEIGHTS[emotion] ?? 0) * score;
    totalWeight += score;
  }
  return totalWeight > 0
    ? Math.max(-1, Math.min(1, weightedSum / totalWeight))
    : 0;
}

export function calculateArousal(scores: EmotionScores): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [emotion, score] of Object.entries(scores)) {
    weightedSum += (AROUSAL_WEIGHTS[emotion] ?? 0) * score;
    totalWeight += score;
  }
  return totalWeight > 0
    ? Math.max(-1, Math.min(1, weightedSum / totalWeight))
    : 0;
}

export function calculateAffectIntensity(scores: EmotionScores): number {
  const values = Object.values(scores).sort((a, b) => b - a);
  if (values.length === 0) return 0;
  const top1 = values[0];
  const top2 = values[1] ?? 0;
  return Math.min(1, top1 * 1.2 + (top1 - top2) * 0.4);
}

export function calculateEmotionalVariability(history: FaceData[]): number {
  const detected = history.filter((h) => h.faceDetected).slice(-24);
  if (detected.length < 3) return 0;
  let transitions = 0;
  for (let i = 1; i < detected.length; i++) {
    if (detected[i].dominantEmotion !== detected[i - 1].dominantEmotion) {
      transitions++;
    }
  }
  return +(transitions / (detected.length - 1)).toFixed(2);
}

export function calculateRegulationEstimate(history: FaceData[]): number {
  const detected = history.filter((h) => h.faceDetected).slice(-30);
  if (detected.length < 5) return 0.5;
  const valences = detected.map((h) => calculateValence(h.emotionScores));
  const mean = valences.reduce((sum, v) => sum + v, 0) / valences.length;
  const variance =
    valences.reduce((sum, v) => sum + (v - mean) ** 2, 0) / valences.length;
  const sd = Math.sqrt(variance);
  return Math.max(0.1, Math.min(0.95, +(1 - sd * 1.35).toFixed(2)));
}

export function calculateFlatAffect(history: FaceData[]): boolean {
  const detected = history.filter((h) => h.faceDetected).slice(-20);
  if (detected.length < 10) return false;
  const avgIntensity =
    detected.reduce((acc, h) => acc + calculateAffectIntensity(h.emotionScores), 0) /
    detected.length;
  return avgIntensity < 0.18;
}

export function classifyAffectQuadrant(valence: number, arousal: number): AffectLabel {
  if (Math.abs(valence) < 0.15 && Math.abs(arousal) < 0.15) {
    return {
      quadrant: 'neutral',
      label: 'Euthymic',
      clinical: 'Emotionally balanced, baseline affect',
      color: 'hsl(215 20% 60%)',
    };
  }
  if (arousal >= 0.15 && valence >= 0.15) {
    return {
      quadrant: 'activated_positive',
      label: 'Activated Positive',
      clinical: 'Excited, engaged, enthusiastic — elevated positive affect',
      color: 'hsl(38 95% 60%)',
    };
  }
  if (arousal >= 0.15 && valence < -0.15) {
    return {
      quadrant: 'activated_negative',
      label: 'Activated Negative',
      clinical: 'Anxious, agitated, distressed — high arousal negative affect',
      color: 'hsl(0 72% 55%)',
    };
  }
  if (arousal < -0.15 && valence >= 0.15) {
    return {
      quadrant: 'deactivated_positive',
      label: 'Deactivated Positive',
      clinical: 'Calm, content, serene — relaxed positive affect',
      color: 'hsl(142 72% 50%)',
    };
  }
  if (arousal < -0.15 && valence < -0.15) {
    return {
      quadrant: 'deactivated_negative',
      label: 'Deactivated Negative',
      clinical: 'Sad, withdrawn, dysphoric — low arousal negative affect',
      color: 'hsl(220 70% 60%)',
    };
  }
  if (valence >= 0.15) {
    return {
      quadrant: 'activated_positive',
      label: 'Positive',
      clinical: 'Generally positive affective tone',
      color: 'hsl(38 95% 60%)',
    };
  }
  return {
    quadrant: 'activated_negative',
    label: 'Negative',
    clinical: 'Generally negative affective tone',
    color: 'hsl(196 75% 55%)',
  };
}

export function extractActionUnits(scores: EmotionScores): ActionUnit[] {
  const {
    happy = 0,
    sad = 0,
    angry = 0,
    fearful = 0,
    surprised = 0,
    disgusted = 0,
  } = scores;

  return [
    {
      au: 'AU1+2',
      name: 'Brow Raise',
      active: fearful + surprised > 0.25,
      intensity: Math.min(1, (fearful + surprised) * 1.1),
      clinical: 'Fear, surprise, inner brow distress',
    },
    {
      au: 'AU4',
      name: 'Brow Lowerer',
      active: angry + sad + fearful > 0.22,
      intensity: Math.min(1, angry * 0.9 + sad * 0.6 + fearful * 0.5),
      clinical: 'Worry, concentration, displeasure',
    },
    {
      au: 'AU6+12',
      name: 'Duchenne Smile',
      active: happy > 0.3,
      intensity: Math.min(1, happy * 1.3),
      clinical: 'Genuine positive affect — cheek and lip involvement',
    },
    {
      au: 'AU7+23',
      name: 'Anger Tensors',
      active: angry > 0.28,
      intensity: Math.min(1, angry * 1.2),
      clinical: 'Eyelid tightening and lip compression — frustration/anger',
    },
    {
      au: 'AU9+16',
      name: 'Disgust Units',
      active: disgusted > 0.22,
      intensity: Math.min(1, disgusted * 1.3),
      clinical: 'Nose wrinkle and lip raise — aversion response',
    },
    {
      au: 'AU15+17',
      name: 'Lip Corner Depress',
      active: sad > 0.25,
      intensity: Math.min(1, sad * 1.25),
      clinical: 'Sadness, grief — downward lip corners and chin raise',
    },
  ];
}

export function detectMicroExpression(history: FaceData[]): MicroExpression | null {
  const detected = history.filter((h) => h.faceDetected).slice(-8);
  if (detected.length < 5) return null;

  const counts: Record<string, number> = {};
  for (const item of detected) {
    counts[item.dominantEmotion] = (counts[item.dominantEmotion] ?? 0) + 1;
  }
  const baselineEmotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  for (let i = 1; i < detected.length - 1; i++) {
    const curr = detected[i];
    if (curr.dominantEmotion !== baselineEmotion) {
      const score = curr.emotionScores[curr.dominantEmotion] ?? 0;
      const prev = detected[i - 1].dominantEmotion;
      const next = detected[i + 1]?.dominantEmotion;
      if (score > 0.38 && prev === baselineEmotion && next === baselineEmotion) {
        return {
          emotion: curr.dominantEmotion,
          intensity: score,
          durationFrames: 1,
        };
      }
    }
  }
  return null;
}

export function computeAffectMetrics(
  faceData: FaceData,
  history: FaceData[]
): AffectMetrics {
  const scores = faceData.emotionScores;
  const valence = calculateValence(scores);
  const arousal = calculateArousal(scores);

  return {
    valence,
    arousal,
    affectIntensity: calculateAffectIntensity(scores),
    emotionalVariability: calculateEmotionalVariability(history),
    regulationEstimate: calculateRegulationEstimate(history),
    flatAffect: calculateFlatAffect(history),
    affectLabel: classifyAffectQuadrant(valence, arousal),
    actionUnits: extractActionUnits(scores),
    microExpression: detectMicroExpression(history),
  };
}

export const RADAR_SIZE = 200;
export const RADAR_CENTER_X = RADAR_SIZE / 2;
export const RADAR_CENTER_Y = RADAR_SIZE / 2;
export const RADAR_SCALE = 82;

export function toRadarCoordinates(valence: number, arousal: number) {
  return {
    x: RADAR_CENTER_X + valence * RADAR_SCALE,
    y: RADAR_CENTER_Y - arousal * RADAR_SCALE,
  };
}
