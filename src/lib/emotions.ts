import {
  EmotionType,
  EmotionScores,
  BehavioralState,
  EmotionTrend,
  ConfidenceLevel,
} from './types';

export const EMOTION_META: Record<
  EmotionType,
  {
    emoji: string;
    label: string;
    color: string;
    glowClass: string;
    hint: string;
    bgColor: string;
  }
> = {
  happy: {
    emoji: '😊',
    label: 'Happy',
    color: 'hsl(38 95% 60%)',
    glowClass: 'glow-happy',
    hint: 'You look great! Keep that energy going.',
    bgColor: 'hsl(38 95% 60% / 0.04)',
  },
  neutral: {
    emoji: '😐',
    label: 'Neutral',
    color: 'hsl(215 20% 65%)',
    glowClass: 'glow-neutral',
    hint: 'You look calm and composed.',
    bgColor: 'hsl(215 20% 65% / 0.03)',
  },
  sad: {
    emoji: '😔',
    label: 'Sad',
    color: 'hsl(196 75% 55%)',
    glowClass: 'glow-sad',
    hint: "You seem a bit down. It's okay to take it slow.",
    bgColor: 'hsl(196 75% 55% / 0.04)',
  },
  angry: {
    emoji: '😠',
    label: 'Tense',
    color: 'hsl(0 72% 51%)',
    glowClass: 'glow-angry',
    hint: 'Feeling a bit tense? A deep breath might help.',
    bgColor: 'hsl(0 72% 51% / 0.04)',
  },
  fearful: {
    emoji: '😨',
    label: 'Anxious',
    color: 'hsl(262 80% 62%)',
    glowClass: 'glow-primary',
    hint: "Noticing some tension. You're doing fine.",
    bgColor: 'hsl(262 80% 62% / 0.04)',
  },
  disgusted: {
    emoji: '😒',
    label: 'Unsettled',
    color: 'hsl(142 50% 45%)',
    glowClass: 'glow-neutral',
    hint: "Something bothering you? I'm here to listen.",
    bgColor: 'hsl(142 50% 45% / 0.03)',
  },
  surprised: {
    emoji: '😲',
    label: 'Surprised',
    color: 'hsl(48 95% 58%)',
    glowClass: 'glow-happy',
    hint: 'Something caught your attention!',
    bgColor: 'hsl(48 95% 58% / 0.04)',
  },
  mixed: {
    emoji: '🌀',
    label: 'Mixed',
    color: 'hsl(262 80% 62%)',
    glowClass: 'glow-primary',
    hint: 'Noticing some mood changes in your expression.',
    bgColor: 'hsl(262 80% 62% / 0.04)',
  },
};

export const BEHAVIORAL_STATE_META: Record<
  BehavioralState,
  { label: string; desc: string; color: string; icon: string }
> = {
  engaged: {
    label: 'Engaged',
    desc: "You're focused and present",
    color: 'hsl(142 72% 50%)',
    icon: '●',
  },
  hesitant: {
    label: 'Hesitant',
    desc: 'A bit uncertain right now',
    color: 'hsl(38 95% 60%)',
    icon: '◐',
  },
  distracted: {
    label: 'Distracted',
    desc: 'Looking away frequently',
    color: 'hsl(215 20% 55%)',
    icon: '◌',
  },
  fatigued: {
    label: 'Fatigued',
    desc: 'You seem a bit tired today',
    color: 'hsl(196 75% 55%)',
    icon: '◑',
  },
  low_mood: {
    label: 'Low Mood',
    desc: 'Affect appears subdued',
    color: 'hsl(0 72% 55%)',
    icon: '▼',
  },
  unknown: {
    label: 'Detecting...',
    desc: 'Analyzing facial cues',
    color: 'hsl(215 20% 55%)',
    icon: '⋯',
  },
};

export function getEmotionMeta(emotion: EmotionType) {
  return EMOTION_META[emotion] ?? EMOTION_META.neutral;
}

export function getBehavioralMeta(state: BehavioralState) {
  return BEHAVIORAL_STATE_META[state] ?? BEHAVIORAL_STATE_META.unknown;
}

export function computeEyeOpenness(landmarks: { x: number; y: number }[]): number {
  if (landmarks.length < 68) return 0.5;
  const leftTop = landmarks[37];
  const leftBottom = landmarks[41];
  const leftHoriz = Math.abs(landmarks[36].x - landmarks[39].x);
  const leftRatio = Math.abs(leftTop.y - leftBottom.y) / (leftHoriz || 1);

  const rightTop = landmarks[43];
  const rightBottom = landmarks[47];
  const rightHoriz = Math.abs(landmarks[42].x - landmarks[45].x);
  const rightRatio = Math.abs(rightTop.y - rightBottom.y) / (rightHoriz || 1);

  return Math.min(1, ((leftRatio + rightRatio) / 2) * 5);
}

export function smoothScores(scoresHistory: EmotionScores[]): EmotionScores {
  const emotions: (keyof EmotionScores)[] = [
    'happy',
    'sad',
    'angry',
    'fearful',
    'disgusted',
    'surprised',
    'neutral',
  ];
  const smoothed: EmotionScores = {
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    disgusted: 0,
    surprised: 0,
    neutral: 0,
  };

  if (scoresHistory.length === 0) return smoothed;

  for (const emotion of emotions) {
    smoothed[emotion] =
      scoresHistory.reduce((sum, score) => sum + (score[emotion] ?? 0), 0) /
      scoresHistory.length;
  }
  return smoothed;
}

export function detectDominantEmotion(scores: EmotionScores): EmotionType {
  const entries = Object.entries(scores) as [EmotionType, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [top, second] = entries;
  if (!top) return 'neutral';
  if (second && top[1] - second[1] < 0.15) {
    return 'mixed';
  }
  return top[0];
}

const NEGATIVE_EMOTIONS: EmotionType[] = ['sad', 'angry', 'fearful', 'disgusted'];
const POSITIVE_EMOTIONS: EmotionType[] = ['happy', 'surprised'];

export function computeEmotionTrend(dominantHistory: EmotionType[]): EmotionTrend {
  if (dominantHistory.length < 5) return 'unknown';
  const recent = dominantHistory.slice(-8);
  const initial = dominantHistory.slice(0, 8);

  const recentNegRatio =
    recent.filter((e) => NEGATIVE_EMOTIONS.includes(e)).length / recent.length;
  const initialNegRatio =
    initial.filter((e) => NEGATIVE_EMOTIONS.includes(e)).length / initial.length;

  const recentPosRatio =
    recent.filter((e) => POSITIVE_EMOTIONS.includes(e)).length / recent.length;
  const initialPosRatio =
    initial.filter((e) => POSITIVE_EMOTIONS.includes(e)).length / initial.length;

  const uniqueEmotions = new Set(recent).size;
  const dominantFrequency =
    recent.filter((e) => e === recent[0]).length / recent.length;

  if (uniqueEmotions >= 4) return 'unstable_mood';
  if (dominantFrequency > 0.75) return 'stable';
  if (recentNegRatio - initialNegRatio > 0.25) return 'declining_mood';
  if (recentPosRatio - initialPosRatio > 0.25) return 'improving_mood';

  const neutralRatio = recent.filter((e) => e === 'neutral').length / recent.length;
  const sadRatio = recent.filter((e) => e === 'sad').length / recent.length;
  if (neutralRatio > 0.5 && sadRatio > 0.1) return 'suppressed_emotion';

  return 'stable';
}

export function computeBehavioralState(
  detectionHistory: boolean[],
  dominantHistory: EmotionType[],
  scoreHistory: number[],
  eyeOpenness: number
): BehavioralState {
  if (dominantHistory.length < 3) return 'unknown';
  const recentDetections = detectionHistory.slice(-10);
  const detectionRatio =
    recentDetections.filter(Boolean).length / (recentDetections.length || 1);

  const recentScores = scoreHistory.slice(-8);
  const avgScore =
    recentScores.reduce((acc, s) => acc + s, 0) /
    Math.max(1, Math.min(8, recentScores.length));

  const recentDominant = dominantHistory.slice(-10);
  const sadCount = recentDominant.filter((e) => e === 'sad').length;

  if (detectionRatio < 0.4) return 'distracted';
  if (eyeOpenness < 0.22 && detectionRatio > 0.7) return 'fatigued';
  if (detectionRatio < 0.7 || avgScore < 0.5 || new Set(recentDominant).size > 4) {
    return 'hesitant';
  }
  if (sadCount / recentDominant.length > 0.6) return 'low_mood';
  return 'engaged';
}

export function getConfidenceLevel(score: number): ConfidenceLevel {
  return score < 0.5 ? 'uncertain' : score <= 0.75 ? 'moderate' : 'high';
}
