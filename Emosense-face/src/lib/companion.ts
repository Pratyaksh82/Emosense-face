import { EmotionType, BehavioralState, EmotionTrend, FaceData } from './types';
import { getEmotionMeta, getBehavioralMeta } from './emotions';

export interface BreathingPhase {
  name: string;
  duration: number;
  scale: number;
  instruction: string;
}

export interface Exercise {
  id: string;
  type: 'breathing' | 'grounding';
  name: string;
  tagline: string;
  intro: string;
  phases?: BreathingPhase[];
  cycles?: number;
  steps?: { count: number; sense: string; instruction: string }[];
}

export const EXERCISES: Record<string, Exercise> = {
  box_breathing: {
    id: 'box_breathing',
    type: 'breathing',
    name: 'Box Breathing',
    tagline: 'Calm your nervous system in under a minute',
    intro:
      'Used by athletes and therapists alike. Breathe in a steady square pattern — each side is 4 seconds.',
    phases: [
      { name: 'Breathe in', duration: 4, scale: 1, instruction: 'Through your nose, slowly and steadily' },
      { name: 'Hold', duration: 4, scale: 1, instruction: 'Hold your breath, stay relaxed' },
      { name: 'Breathe out', duration: 4, scale: 0.5, instruction: 'Out through your mouth, fully empty' },
      { name: 'Hold', duration: 4, scale: 0.5, instruction: 'Pause — then begin again' },
    ],
    cycles: 4,
  },
  '478_breathing': {
    id: '478_breathing',
    type: 'breathing',
    name: '4-7-8 Breathing',
    tagline: 'Release anxiety and quiet your mind',
    intro:
      'A technique developed by Dr Andrew Weil. The extended exhale activates your body’s relaxation response.',
    phases: [
      { name: 'Breathe in', duration: 4, scale: 1, instruction: 'Quietly through your nose for 4 seconds' },
      { name: 'Hold', duration: 7, scale: 1, instruction: 'Hold your breath gently for 7 seconds' },
      { name: 'Breathe out', duration: 8, scale: 0.5, instruction: 'Whoosh out through your mouth for 8 seconds' },
    ],
    cycles: 4,
  },
  grounding_54321: {
    id: 'grounding_54321',
    type: 'grounding',
    name: '5-4-3-2-1 Grounding',
    tagline: 'Anchor yourself in the present moment',
    intro:
      'When thoughts spin out or anxiety rises, reconnect with your senses to re-anchor your awareness.',
    steps: [
      { count: 5, sense: 'Sight', instruction: 'Look around and notice 5 things you can see right now.' },
      { count: 4, sense: 'Touch', instruction: 'Notice 4 things you can physically feel (feet on floor, clothes).' },
      { count: 3, sense: 'Sound', instruction: 'Listen carefully for 3 distinct sounds around you.' },
      { count: 2, sense: 'Smell', instruction: 'Notice 2 things you can smell, or 2 favorite scents you love.' },
      { count: 1, sense: 'Taste', instruction: 'Notice 1 taste in your mouth, or take a sip of water.' },
    ],
  },
};

export const COMPANION_RESPONSES: Record<string, string[]> = {
  'happy|stable|engaged': [
    "You seem genuinely good right now! What's been going well for you today?",
    "I can see you're in a positive place. Is there anything you'd like to celebrate or talk through?",
  ],
  'happy|improving_mood|engaged': [
    "Your mood is lifting — that's really nice to see. What's shifted for you?",
    "Something good must be happening. Want to share what's brought that smile?",
  ],
  'sad|stable|low_mood': [
    "I can see you're carrying something heavy right now. You don't have to push through it alone — what's on your mind?",
    "You seem down, and that's completely okay. Sometimes just letting it out helps. What's been weighing on you?",
  ],
  'sad|declining_mood|low_mood': [
    "I notice things seem to be getting harder for you. I'm here. What's been going on?",
    "Your expression tells me this has been a tough stretch. Can you tell me more about what you're feeling?",
  ],
  'sad|stable|engaged': [
    "You seem a bit down but you're still here showing up — that takes strength. How long have you been feeling this way?",
    "I notice some sadness in your expression. What's been on your mind lately?",
  ],
  'fearful|stable|hesitant': [
    "It looks like something might be worrying you. That's a valid feeling. What's been making you anxious?",
    "I can see some tension. You're safe here — what's on your mind?",
  ],
  'fearful|unstable_mood|hesitant': [
    "I notice your emotions are shifting quite a bit. That can feel overwhelming. What's going on?",
    "It seems like you're going through something unsettling. I'm right here to listen.",
  ],
  'angry|stable|engaged': [
    "I can sense some frustration in your expression. What's been getting to you?",
    "You seem tense right now. Want to talk about what's been bothering you?",
  ],
  'angry|declining_mood|engaged': [
    "It looks like the frustration has been building up. That's exhausting. What's been happening?",
    "I notice things seem to be escalating for you emotionally. What's driving that?",
  ],
  'neutral|stable|fatigued': [
    "You look calm but a bit tired. Have you been getting enough rest lately?",
    "I notice you seem a little worn out. What's been draining your energy?",
  ],
  'neutral|stable|engaged': [
    "You look composed and attentive. What's on your mind today?",
    "I'm here whenever you're ready. What would you like to explore or talk through?",
  ],
  'mixed|unstable_mood|hesitant': [
    "I can see a mix of feelings playing out on your face. It's okay to feel conflicted. How are you holding up?",
    "There seems to be a lot going on beneath the surface. Take a breath — where would you like to start?",
  ],
  default: [
    "I'm tuned in and listening to you. How are you feeling right in this moment?",
    "Thank you for sharing that with me. What else is on your mind?",
    "I hear you. Tell me more about how that is affecting your day.",
  ],
};

export function getSuggestedExercise(faceData: FaceData | null): Exercise | null {
  if (!faceData?.faceDetected) return null;
  const { dominantEmotion: emotion, behavioralState: state } = faceData;

  if (emotion === 'fearful') return EXERCISES.grounding_54321;
  if (emotion === 'angry') return EXERCISES.box_breathing;
  if (emotion === 'sad' || state === 'low_mood' || state === 'fatigued') {
    return EXERCISES['478_breathing'];
  }
  if (state === 'hesitant') return EXERCISES.grounding_54321;
  return null;
}

export function getSuggestedPrompts(faceData: FaceData | null): string[] {
  if (!faceData || !faceData.faceDetected) {
    return ['Just checking in today', "Not sure how I feel honestly", 'I have a lot on my mind'];
  }

  const { dominantEmotion: emotion, behavioralState: state, emotionTrend: trend } = faceData;
  const prompts: string[] = [];

  const emotionMap: Record<string, string[]> = {
    sad: ["I've been feeling really low lately", "Everything feels heavy right now", "I just need someone to talk to"],
    angry: ["I'm so frustrated right now", "Something really got to me today", "I can't seem to calm down"],
    fearful: ["I'm really anxious about something", "I can't stop worrying", "I feel overwhelmed"],
    happy: ["I actually had a good day today", "Something really lifted my mood", "I'm feeling better than usual"],
    neutral: ["Just checking in today", "Not sure how I feel honestly", "I have a lot on my mind"],
    mixed: ["My emotions are all over the place", "I don't know how to describe how I feel", "It's complicated"],
    surprised: ["Something unexpected happened", "I wasn't expecting this at all"],
    disgusted: ["Something's really bothering me", "I can't shake this feeling"],
  };

  const stateMap: Record<string, string[]> = {
    fatigued: ["I'm exhausted and don't know why", "I haven't been sleeping well"],
    hesitant: ["I'm not sure I want to talk about it", "It's hard to open up right now"],
    distracted: ["My mind keeps wandering", "I can't focus today"],
    low_mood: ["I feel really flat right now", "Nothing feels interesting"],
  };

  const trendMap: Record<string, string[]> = {
    declining_mood: ["Things have been getting harder", "I've been struggling more lately"],
    improving_mood: ["I think I'm starting to feel better", "Something's helping"],
    suppressed_emotion: ["I think I'm holding a lot in", "I've been putting on a brave face"],
  };

  prompts.push(...(emotionMap[emotion] ?? []));
  prompts.push(...(stateMap[state] ?? []));
  prompts.push(...(trendMap[trend] ?? []));

  return prompts.sort(() => Math.random() - 0.5).slice(0, 3);
}

export function detectProactiveCheckIn(
  prev: FaceData | null,
  curr: FaceData | null
): string | null {
  if (!curr || !curr.faceDetected) return null;
  if (prev && prev.faceDetected) {
    const prevEmo = prev.dominantEmotion;
    const currEmo = curr.dominantEmotion;
    if (prevEmo !== currEmo) {
      const transitions: Record<string, string> = {
        'happy|sad': 'I noticed a shift in your expression — are you okay?',
        'happy|angry': 'Something seems to have changed. What happened?',
        'neutral|sad': "I'm picking up a change in your expression. Want to talk?",
        'neutral|angry': "You seem frustrated. What's on your mind?",
        'sad|happy': "That's a brighter expression! Did something good happen?",
        'angry|neutral': "You seem a little calmer now. That's good.",
        'fearful|neutral': 'You seem to be settling. Take your time.',
      };
      const key = `${prevEmo}|${currEmo}`;
      if (transitions[key]) return transitions[key];
    }
    if (prev.behavioralState !== 'fatigued' && curr.behavioralState === 'fatigued') {
      return "You seem tired. It's completely okay to take a break.";
    }
    if (prev.emotionTrend !== 'declining_mood' && curr.emotionTrend === 'declining_mood') {
      return 'I notice things seem to be shifting downwards. How are you holding up?';
    }
  }
  return null;
}

export function formatCameraContext(faceData: FaceData | null): string {
  if (!faceData || !faceData.faceDetected) return '';
  const emo = getEmotionMeta(faceData.dominantEmotion);
  const state = getBehavioralMeta(faceData.behavioralState);
  return `[Camera: ${emo.label} · ${state.label} · ${Math.round(faceData.confidence * 100)}% conf]`;
}

export function generateCompanionResponse(faceData: FaceData | null): string {
  if (!faceData || !faceData.faceDetected) {
    const fallback = [
      "I can't quite see you right now — make sure your face is in view so I can better understand your state. How are you feeling?",
      "Position yourself in front of the camera so I can see you clearly. In the meantime, feel free to share what's on your mind.",
    ];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  const keys = [
    `${faceData.dominantEmotion}|${faceData.emotionTrend}|${faceData.behavioralState}`,
    `${faceData.dominantEmotion}|stable|${faceData.behavioralState}`,
    `${faceData.dominantEmotion}|${faceData.emotionTrend}|engaged`,
    `default|${faceData.emotionTrend}|${faceData.behavioralState}`,
    `default|${faceData.emotionTrend}|engaged`,
    'default',
  ];

  for (const k of keys) {
    if (COMPANION_RESPONSES[k] && COMPANION_RESPONSES[k].length > 0) {
      const bank = COMPANION_RESPONSES[k];
      return bank[Math.floor(Math.random() * bank.length)];
    }
  }

  const defaultBank = COMPANION_RESPONSES.default;
  return defaultBank[Math.floor(Math.random() * defaultBank.length)];
}
