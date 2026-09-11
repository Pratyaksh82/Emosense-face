import {
  FaceData,
  SessionSummary,
  EmotionType,
  SeverityLevel,
  ClinicalReport,
} from './types';
import {
  calculateValence,
  calculateArousal,
  calculateEmotionalVariability,
  calculateRegulationEstimate,
  calculateFlatAffect,
} from './affect';
import { formatDuration } from './utils';

export const CONSOLING_MESSAGES: Record<string, string[]> = {
  positive: [
    "✨ You had a really good session today! Keep nurturing that positive energy and taking time for yourself.",
    "🌟 There was a lot of brightness in your expressions today. Remember what brought you joy and carry it forward.",
    "💫 You're doing wonderful. Keep trusting yourself and celebrating the small wins along the way.",
  ],
  neutral: [
    "🌿 You seemed steady and centered today. Neutral, calm moments are often where we recharge the most.",
    "🍵 A quiet, reflective session today. Sometimes just having a peaceful baseline is exactly what we need.",
    "🌱 Steady progress happens in the calm spaces. You showed up for yourself today, and that matters.",
  ],
  concerning: [
    "💙 I noticed you seemed to be carrying something heavy today. Whatever it is, you don't have to carry it alone — reach out to someone you trust. 🤝",
    "🫂 Today looked difficult, and that's completely okay. Please be gentle with yourself. Small steps forward are still steps forward. 🌱",
    "💜 It seemed like things were weighing on you. You're allowed to feel that. Asking for help is a sign of strength, not weakness. 💪",
    "🌊 I could see the weight of it in your expression today. You're not alone in this. Please talk to someone who can support you. 🕊️",
  ],
  distressed: [
    "🫂 Today was hard — I could see that clearly. Please know it won't always feel this way. Reach out to someone close to you, or a professional who can help. You deserve that support. 💙",
    "💜 You seemed to be in a really difficult place today. That takes courage to sit with. Please don't go through this alone — there are people who genuinely want to help. 🤍",
    "🌧️ I noticed significant pain during our session. You deserve real, proper support. Please consider talking to a counsellor or someone you deeply trust. You matter. 💛",
    "🕊️ What you're going through seems really heavy, and I see you. You matter, and so does your wellbeing. Please reach out — you don't have to handle this by yourself. 🫂",
  ],
  fatigued: [
    "😴 You looked really tired today. Rest isn't a luxury right now — it's something you genuinely need. Please take care of yourself. 💛",
    "🌙 Fatigue can make everything feel heavier than it actually is. Try to get some proper rest tonight. You'll face things better when you're recovered. 🌿",
    "☁️ Your body and mind are both asking for rest. Give yourself permission to slow down today — you've earned it. 🛌",
  ],
  hesitant: [
    "🌸 It seemed like it was hard to fully open up today, and that's completely okay. There's no pressure here. Come back whenever you're ready. 💛",
    "🌱 Sometimes we're not ready to talk, and that's valid. Just knowing you can is enough for now. We'll be here. 🤍",
    "🍃 Opening up takes time and trust. You don't have to have it all figured out. Be patient and kind with yourself. 💙",
  ],
  low_mood: [
    "💙 Low days are real and they're hard. Please be kind to yourself today — small things matter. A walk, a warm drink, a kind word from someone you love. 🌼",
    "🌧️ I could see your mood was low today. That's worth acknowledging and honouring. You don't have to push through it — sit with it gently, then reach for support. 🫂",
    "🌱 Low moments pass, even when it doesn't feel that way. You're doing better than you think just by being here. Hold on. 💛",
  ],
  improving: [
    "🌅 It was really good to see your mood shift in a better direction during our time together. Hold on to whatever helped bring that shift. 💛",
    "🌤️ Something changed for you today — I could see it in your expression. That movement matters more than you know. Keep going. ✨",
    "🌱 You seemed to find a little more ground beneath your feet as the session went on. That's real, quiet progress. Be proud of it. 💚",
  ],
  suppressed: [
    "🌊 Sometimes we hold things in without even realising it. It's okay to let yourself feel what's underneath. You don't always have to be okay. 💙",
    "🍂 I noticed you keeping things composed today. There's no shame in having more going on beneath the surface — allow yourself to feel it when you're ready. 🤍",
    "🌸 It can be exhausting to keep it all together all the time. Give yourself space to be human. That's not weakness — that's wisdom. 💛",
  ],
};

export const CLOSING_NOTES: Record<SeverityLevel, string> = {
  positive: "💚 You're doing well. Keep checking in with yourself — you're worth the attention.",
  neutral: "🌿 Take things one step at a time. You've got this, even on the quiet days.",
  concerning: "💙 Please don't hesitate to reach out for support — it's one of the bravest things you can do.",
  distressed: "🫂 Your wellbeing matters deeply. Please talk to someone you trust or a mental health professional.",
};

export function generateClinicalReport(history: FaceData[]): ClinicalReport {
  const detected = history.filter((h) => h.faceDetected);
  if (detected.length < 3) {
    return {
      avgValence: 0,
      avgArousal: 0,
      peakNegativeValence: 0,
      emotionalVariability: 0,
      regulationEstimate: 0.5,
      flatAffect: false,
      clinicalObservations: ['Insufficient face data recorded to generate affect report.'],
    };
  }

  const valences = detected.map((h) => calculateValence(h.emotionScores));
  const arousals = detected.map((h) => calculateArousal(h.emotionScores));

  const avgValence = +(
    valences.reduce((sum, v) => sum + v, 0) / valences.length
  ).toFixed(3);
  const avgArousal = +(
    arousals.reduce((sum, a) => sum + a, 0) / arousals.length
  ).toFixed(3);
  const peakNegativeValence = +Math.min(...valences).toFixed(3);
  const emotionalVariability = calculateEmotionalVariability(detected);
  const regulationEstimate = calculateRegulationEstimate(detected);
  const flatAffect = calculateFlatAffect(detected);

  const observations: string[] = [];
  if (avgValence > 0.4) {
    observations.push(
      `Predominant positive affect throughout the session (avg valence: +${avgValence.toFixed(2)}) — consistent with euthymic or elevated mood.`
    );
  } else if (avgValence < -0.4) {
    observations.push(
      `Sustained negative valence across the session (avg: ${avgValence.toFixed(2)}) — may indicate low mood, dysphoria, or distress.`
    );
  } else if (avgValence < -0.1) {
    observations.push(
      `Mild negative valence observed (avg: ${avgValence.toFixed(2)}) — affect leaning negative without reaching clinical severity.`
    );
  }

  if (avgArousal > 0.5) {
    observations.push(
      `High arousal level detected — activation state consistent with anxiety, agitation, or heightened stress response.`
    );
  } else if (avgArousal < -0.3) {
    observations.push(
      `Low arousal throughout — consistent with fatigue, flat affect, or psychomotor slowing.`
    );
  }

  if (emotionalVariability > 0.55) {
    observations.push(
      `High emotional variability detected (${(emotionalVariability * 100).toFixed(0)}% frame shifts) — suggests labile affect or difficulty with emotion regulation.`
    );
  } else if (emotionalVariability < 0.1 && detected.length > 15) {
    observations.push(
      `Low emotional variability (${(emotionalVariability * 100).toFixed(0)}% frame shifts) — affect appears stable and consistent.`
    );
  }

  if (flatAffect) {
    observations.push(
      `Flat or restricted affect observed — diminished facial expressivity across the session. May indicate emotional blunting, suppression, or affective numbing.`
    );
  }

  if (regulationEstimate < 0.35) {
    observations.push(
      `Low affect regulation estimate — emotional states appeared difficult to modulate during the session.`
    );
  } else if (regulationEstimate > 0.75) {
    observations.push(
      `Good affect regulation observed — emotional expressions remained proportionate and variable within normal range.`
    );
  }

  if (peakNegativeValence < -0.75) {
    observations.push(
      `Significant peak of negative affect recorded (valence: ${peakNegativeValence.toFixed(2)}) — a brief period of intense negative emotional expression was detected.`
    );
  }

  if (observations.length === 0) {
    observations.push(
      `No clinically notable patterns detected. Affect appeared within normal range for the session duration.`
    );
  }

  return {
    avgValence,
    avgArousal,
    peakNegativeValence,
    emotionalVariability,
    regulationEstimate,
    flatAffect,
    clinicalObservations: observations,
  };
}

export function generateSessionSummary(
  history: FaceData[],
  durationMs: number
): SessionSummary | null {
  const detected = history.filter((h) => h.faceDetected);
  if (detected.length < 3) return null;

  const emotionCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};
  const trendCounts: Record<string, number> = {};

  for (const frame of detected) {
    emotionCounts[frame.dominantEmotion] = (emotionCounts[frame.dominantEmotion] ?? 0) + 1;
    stateCounts[frame.behavioralState] = (stateCounts[frame.behavioralState] ?? 0) + 1;
    trendCounts[frame.emotionTrend] = (trendCounts[frame.emotionTrend] ?? 0) + 1;
  }

  const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const dominantEmotion = sortedEmotions[0][0] as EmotionType;
  const dominantEmotionPct = Math.round((sortedEmotions[0][1] / detected.length) * 100);

  const dominantBehavior = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0][0] as any;
  const overallTrend = Object.entries(trendCounts).sort((a, b) => b[1] - a[1])[0][0] as any;

  const emotionBreakdown = sortedEmotions.slice(0, 4).map(([emo, count]) => ({
    emotion: emo as EmotionType,
    pct: Math.round((count / detected.length) * 100),
  }));

  const negativePct = emotionBreakdown
    .filter(({ emotion }) => ['sad', 'angry', 'fearful', 'disgusted'].includes(emotion))
    .reduce((sum, { pct }) => sum + pct, 0);

  const happyPct = emotionBreakdown.find(({ emotion }) => emotion === 'happy')?.pct ?? 0;

  let severity: SeverityLevel;
  if (negativePct > 60 || dominantBehavior === 'low_mood') {
    severity = 'distressed';
  } else if (negativePct > 35) {
    severity = 'concerning';
  } else if (happyPct > 45 && overallTrend !== 'declining_mood') {
    severity = 'positive';
  } else {
    severity = 'neutral';
  }

  let messageBank = CONSOLING_MESSAGES[severity] ?? CONSOLING_MESSAGES.neutral;
  if (dominantBehavior === 'fatigued' && severity !== 'distressed') {
    messageBank = CONSOLING_MESSAGES.fatigued;
  } else if (dominantBehavior === 'hesitant') {
    messageBank = CONSOLING_MESSAGES.hesitant;
  } else if (dominantBehavior === 'low_mood' && severity !== 'distressed') {
    messageBank = CONSOLING_MESSAGES.low_mood;
  } else if (overallTrend === 'improving_mood' && severity !== 'distressed') {
    messageBank = CONSOLING_MESSAGES.improving;
  } else if (overallTrend === 'suppressed_emotion') {
    messageBank = CONSOLING_MESSAGES.suppressed;
  }

  const consolingMessage =
    messageBank[Math.floor(Math.random() * messageBank.length)];
  const closingNote = CLOSING_NOTES[severity];

  const psychReport = generateClinicalReport(detected);

  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    duration: durationMs,
    dominantEmotion,
    dominantEmotionPct,
    overallTrend,
    dominantBehavior,
    emotionBreakdown,
    consolingMessage,
    closingNote,
    severityLevel: severity,
    psychReport,
  };
}

export function printClinicalReport(summary: SessionSummary) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EmoSense AI — Affect & Expression Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0; }
    .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .card-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .card-value { font-size: 20px; font-weight: 700; color: #0f172a; }
    .section-title { font-size: 16px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; margin-bottom: 12px; }
    ul { padding-left: 20px; margin: 0; }
    li { margin-bottom: 8px; }
    .disclaimer { font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 40px; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">EmoSense AI — Affect & Expression Report</h1>
    <div class="subtitle">Session recorded on ${new Date(summary.date).toLocaleString()} · Duration: ${formatDuration(summary.duration)}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Avg Valence</div>
      <div class="card-value">${summary.psychReport.avgValence >= 0 ? '+' : ''}${summary.psychReport.avgValence.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Arousal</div>
      <div class="card-value">${summary.psychReport.avgArousal >= 0 ? '+' : ''}${summary.psychReport.avgArousal.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Emotional Variability</div>
      <div class="card-value">${(summary.psychReport.emotionalVariability * 100).toFixed(0)}%</div>
    </div>
    <div class="card">
      <div class="card-label">Regulation Estimate</div>
      <div class="card-value">${(summary.psychReport.regulationEstimate * 100).toFixed(0)}%</div>
    </div>
    <div class="card">
      <div class="card-label">Flat Affect</div>
      <div class="card-value">${summary.psychReport.flatAffect ? 'Observed' : 'None'}</div>
    </div>
    <div class="card">
      <div class="card-label">Dominant Emotion</div>
      <div class="card-value" style="text-transform: capitalize;">${summary.dominantEmotion} (${summary.dominantEmotionPct}%)</div>
    </div>
  </div>

  <div class="section-title">Emotion Breakdown</div>
  <ul>
    ${summary.emotionBreakdown
      .map(
        (e) =>
          `<li style="text-transform: capitalize;"><strong>${e.emotion}:</strong> ${e.pct}%</li>`
      )
      .join('')}
  </ul>

  <div class="section-title">Clinical & Affective Observations</div>
  <ul>
    ${summary.psychReport.clinicalObservations.map((o) => `<li>${o}</li>`).join('')}
  </ul>

  <div class="disclaimer">
    Notice: EmoSense AI facial affect tracking is an educational, supportive observational tool and does not constitute a formal psychological diagnostic instrument.
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}
