/**
 * Creates a synthetic animated face video stream using canvas.captureStream()
 * allowing full testing of face tracking, emotion detection, and FACS units
 * even when the physical webcam is in use, shuttered, or unavailable.
 */
export function createDemoFaceStream(): { stream: MediaStream; stop: () => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let animationFrameId: number;
  let startTime = Date.now();

  function draw() {
    const elapsed = (Date.now() - startTime) / 1000;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Natural head movement (subtle float)
    const headX = 320 + Math.sin(elapsed * 0.8) * 8;
    const headY = 240 + Math.cos(elapsed * 1.2) * 5;

    // Emotion cycle: 0-8s happy smile, 8-15s neutral, 15-22s surprise, 22-30s thoughtful/gentle
    const cycle = elapsed % 24;
    let smileAmount = 0;
    let browRaise = 0;
    let mouthOpen = 0;

    if (cycle < 8) {
      // Happy / Duchenne smile
      smileAmount = 0.8 + Math.sin(elapsed * 2) * 0.15;
      browRaise = 0.2;
    } else if (cycle < 14) {
      // Calm Neutral
      smileAmount = 0.1;
      browRaise = 0;
    } else if (cycle < 19) {
      // Surprised
      browRaise = 0.8;
      mouthOpen = 0.5 + Math.sin(elapsed * 3) * 0.1;
      smileAmount = 0.2;
    } else {
      // Content / Warm smile
      smileAmount = 0.5;
      browRaise = 0.1;
    }

    // Blink every 3.5 seconds
    const blinkCycle = elapsed % 3.5;
    const isBlinking = blinkCycle > 3.35;

    // --- Draw Body / Shoulders ---
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(headX, headY + 230, 160, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Draw Neck ---
    ctx.fillStyle = '#e2b397';
    ctx.fillRect(headX - 35, headY + 90, 70, 70);

    // --- Draw Face Oval ---
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f8d2b7';
    ctx.beginPath();
    ctx.ellipse(headX, headY, 95, 125, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Hair ---
    ctx.fillStyle = '#2d1c14';
    ctx.beginPath();
    ctx.ellipse(headX, headY - 80, 105, 70, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX - 90, headY - 20, 25, 75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX + 90, headY - 20, 25, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Eyebrows ---
    const browY = headY - 35 - browRaise * 12;
    ctx.strokeStyle = '#2d1c14';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(headX - 60, browY + 3);
    ctx.quadraticCurveTo(headX - 40, browY - 6, headX - 20, browY + 2);
    ctx.stroke();

    // Right eyebrow
    ctx.beginPath();
    ctx.moveTo(headX + 20, browY + 2);
    ctx.quadraticCurveTo(headX + 40, browY - 6, headX + 60, browY + 3);
    ctx.stroke();

    // --- Eyes ---
    const eyeY = headY - 15;
    const eyeSpacing = 40;

    if (isBlinking) {
      // Closed eye slit
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headX - eyeSpacing - 18, eyeY);
      ctx.lineTo(headX - eyeSpacing + 18, eyeY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX + eyeSpacing - 18, eyeY);
      ctx.lineTo(headX + eyeSpacing + 18, eyeY);
      ctx.stroke();
    } else {
      // Open eye whites
      const eyeHeight = 12 + browRaise * 4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(headX - eyeSpacing, eyeY, 18, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headX + eyeSpacing, eyeY, 18, eyeHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (with slight glance)
      const glanceX = Math.sin(elapsed * 0.6) * 4;
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(headX - eyeSpacing + glanceX, eyeY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + eyeSpacing + glanceX, eyeY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Iris highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - eyeSpacing + glanceX - 2.5, eyeY - 2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + eyeSpacing + glanceX - 2.5, eyeY - 2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Nose ---
    ctx.strokeStyle = '#dfa887';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(headX, headY - 5);
    ctx.lineTo(headX + 4, headY + 25);
    ctx.lineTo(headX - 6, headY + 28);
    ctx.stroke();

    // --- Mouth ---
    const mouthY = headY + 58;
    ctx.strokeStyle = '#be185d';
    ctx.fillStyle = '#9d174d';
    ctx.lineWidth = 3;

    if (mouthOpen > 0.2) {
      // Open surprised mouth
      ctx.beginPath();
      ctx.ellipse(headX, mouthY + 5, 16, 18 * mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Smile / curved mouth
      const smileCurve = 8 + smileAmount * 18;
      ctx.beginPath();
      ctx.moveTo(headX - 32, mouthY - smileAmount * 4);
      ctx.quadraticCurveTo(headX, mouthY + smileCurve, headX + 32, mouthY - smileAmount * 4);
      if (smileAmount > 0.4) {
        // Open smile showing teeth
        ctx.fillStyle = '#ffffff';
        ctx.quadraticCurveTo(headX, mouthY + smileCurve - 4, headX - 32, mouthY - smileAmount * 4);
        ctx.fill();
      }
      ctx.stroke();
    }

    // Demo watermark tag
    ctx.fillStyle = 'rgba(139, 92, 246, 0.7)';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('DEMO SIMULATION FEED', 20, 35);

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();

  const stream = canvas.captureStream(30);

  const stop = () => {
    cancelAnimationFrame(animationFrameId);
    stream.getTracks().forEach((t) => t.stop());
  };

  return { stream, stop };
}
