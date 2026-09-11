export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised'
  | 'neutral'
  | 'mixed';

export type EmotionScores = {
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  neutral: number;
  [key: string]: number;
};

export type BehavioralState =
  | 'engaged'
  | 'hesitant'
  | 'distracted'
  | 'fatigued'
  | 'low_mood'
  | 'unknown';

export type EmotionTrend =
  | 'stable'
  | 'improving_mood'
  | 'declining_mood'
  | 'suppressed_emotion'
  | 'unstable_mood'
  | 'unknown';

export type ConfidenceLevel = 'uncertain' | 'moderate' | 'high';

export type SeverityLevel = 'distressed' | 'concerning' | 'positive' | 'neutral';

export interface FaceData {
  dominantEmotion: EmotionType;
  emotionScores: EmotionScores;
  emotionTrend: EmotionTrend;
  behavioralState: BehavioralState;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  timestamp: string;
  faceDetected: boolean;
  eyeOpenness: number;
}

export interface ActionUnit {
  au: string;
  name: string;
  active: boolean;
  intensity: number;
  clinical: string;
}

export interface MicroExpression {
  emotion: EmotionType;
  intensity: number;
  durationFrames: number;
}

export interface AffectLabel {
  quadrant: string;
  label: string;
  clinical: string;
  color: string;
}

export interface AffectMetrics {
  valence: number;
  arousal: number;
  affectIntensity: number;
  emotionalVariability: number;
  regulationEstimate: number;
  flatAffect: boolean;
  affectLabel: AffectLabel;
  actionUnits: ActionUnit[];
  microExpression: MicroExpression | null;
}

export interface ClinicalReport {
  avgValence: number;
  avgArousal: number;
  peakNegativeValence: number;
  emotionalVariability: number;
  regulationEstimate: number;
  flatAffect: boolean;
  clinicalObservations: string[];
}

export interface SessionSummary {
  id: string;
  date: string;
  duration: number; // in milliseconds
  dominantEmotion: EmotionType;
  dominantEmotionPct: number;
  overallTrend: EmotionTrend;
  dominantBehavior: BehavioralState;
  emotionBreakdown: { emotion: EmotionType; pct: number }[];
  consolingMessage: string;
  closingNote: string;
  severityLevel: SeverityLevel;
  psychReport: ClinicalReport;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'proactive';
  content: string;
  timestamp: Date;
  context?: {
    emotion: EmotionType;
    state: BehavioralState;
    trend: EmotionTrend;
  };
}
