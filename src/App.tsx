import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCamera } from './hooks/useCamera';
import { useEmotionDetection } from './hooks/useEmotionDetection';
import { useJournal } from './hooks/useJournal';
import { useReminder } from './hooks/useReminder';
import { Header } from './components/Header';
import { CameraView } from './components/CameraView';
import { EmotionAnalysis } from './components/EmotionAnalysis';
import { ChatSection } from './components/ChatSection';
import { RightPanel } from './components/RightPanel';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { JournalModal } from './components/JournalModal';
import { FocusMode } from './components/FocusMode';
import { ReminderBanner } from './components/ReminderBanner';
import { SessionSummary } from './lib/types';
import { generateSessionSummary } from './lib/report';
import { getEmotionMeta } from './lib/emotions';

export const App: React.FC = () => {
  const {
    videoRef,
    status: cameraStatus,
    error: cameraError,
    isDemoMode,
    startDemo,
    toggle: toggleCamera,
  } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    modelStatus,
    faceData,
    history,
    isRunning,
    start: startDetection,
    stop: stopDetection,
  } = useEmotionDetection(videoRef, canvasRef);

  const { entries, addEntry, removeEntry, clearAll } = useJournal();
  const {
    visible: reminderVisible,
    daysSinceLast,
    dismiss: dismissReminder,
  } = useReminder(entries);

  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [journalOpen, setJournalOpen] = useState<boolean>(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

  const sessionStartRef = useRef<number | null>(null);
  const prevCameraStatusRef = useRef(cameraStatus);

  // Monitor session begin / end to compute summary
  useEffect(() => {
    // Started session
    if (prevCameraStatusRef.current !== 'active' && cameraStatus === 'active') {
      sessionStartRef.current = Date.now();
      setSessionSummary(null);
    }

    // Ended session
    if (prevCameraStatusRef.current === 'active' && cameraStatus === 'idle') {
      const durationMs = sessionStartRef.current
        ? Date.now() - sessionStartRef.current
        : 0;

      if (durationMs >= 3000) {
        const summary = generateSessionSummary(history, durationMs);
        if (summary) {
          setSessionSummary(summary);
          addEntry(summary);
        }
      }
      sessionStartRef.current = null;
    }

    prevCameraStatusRef.current = cameraStatus;
  }, [cameraStatus, history, addEntry]);

  const handleNewSession = useCallback(() => {
    setSessionSummary(null);
    if (cameraStatus !== 'active') {
      toggleCamera();
    }
  }, [cameraStatus, toggleCamera]);

  const dominantEmotion = faceData?.dominantEmotion ?? 'neutral';
  const emotionMeta = getEmotionMeta(dominantEmotion);
  const isDetected = cameraStatus === 'active' && faceData?.faceDetected;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background mood glow when face is actively tracked */}
      <AnimatePresence>
        {isDetected && !focusMode && (
          <motion.div
            key={dominantEmotion}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background: `radial-gradient(ellipse 65% 45% at 50% 0%, ${emotionMeta.color}0a 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Main Top Header */}
      <Header
        cameraActive={cameraStatus === 'active'}
        modelStatus={modelStatus}
        faceData={faceData}
        focusMode={focusMode}
        journalOpen={journalOpen}
        journalCount={entries.length}
        onToggleFocus={() => {
          setFocusMode((prev) => !prev);
          setJournalOpen(false);
        }}
        onToggleJournal={() => {
          setJournalOpen((prev) => !prev);
          setFocusMode(false);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {focusMode ? (
            <motion.div
              key="focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 overflow-hidden"
            >
              <FocusMode
                videoRef={videoRef}
                canvasRef={canvasRef}
                cameraStatus={cameraStatus}
                modelStatus={modelStatus}
                faceData={faceData}
                isRunning={isRunning}
                history={history}
                onToggleCamera={toggleCamera}
                onStartDetection={startDetection}
                onStopDetection={stopDetection}
                onExitFocus={() => setFocusMode(false)}
              />
            </motion.div>
          ) : (
            <motion.main
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[310px_1fr_310px] min-h-0 overflow-hidden"
            >
              {/* Left Sidebar: Camera Viewport & Emotion Probabilities */}
              <aside className="flex flex-col border-r border-border bg-card/20 p-4 overflow-y-auto gap-4">
                <CameraView
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  cameraStatus={cameraStatus}
                  cameraError={cameraError}
                  isDemoMode={isDemoMode}
                  modelStatus={modelStatus}
                  faceData={faceData}
                  isRunning={isRunning}
                  onToggle={toggleCamera}
                  onStartDemo={startDemo}
                  onStartDetection={startDetection}
                  onStopDetection={stopDetection}
                />

                <div className="border-t border-border pt-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                    Emotion Analysis
                  </p>
                  <EmotionAnalysis
                    faceData={faceData}
                    isRunning={cameraStatus === 'active'}
                  />
                </div>
              </aside>

              {/* Center Main Stage: Emotion-Aware AI Chat & Modals */}
              <section className="flex flex-col h-full min-h-0 overflow-hidden relative border-r border-border lg:border-r-0">
                <ChatSection faceData={faceData} />

                {/* Session Summary Modal Overlay */}
                <AnimatePresence>
                  {sessionSummary && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-md p-6 overflow-y-auto"
                    >
                      <SessionSummaryModal
                        summary={sessionSummary}
                        onDismiss={() => setSessionSummary(null)}
                        onNewSession={handleNewSession}
                        onViewJournal={() => {
                          setSessionSummary(null);
                          setJournalOpen(true);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Journal Modal Overlay */}
                <AnimatePresence>
                  {journalOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-md p-6 overflow-y-auto"
                    >
                      <JournalModal
                        entries={entries}
                        onRemove={removeEntry}
                        onClearAll={clearAll}
                        onClose={() => setJournalOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Right Sidebar: Mood History, Valence-Arousal Radar, FACS */}
              <RightPanel faceData={faceData} history={history} />
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Non-intrusive reminder banner */}
      <ReminderBanner
        visible={reminderVisible && cameraStatus !== 'active'}
        daysSinceLast={daysSinceLast}
        onStartSession={() => {
          dismissReminder();
          setFocusMode(false);
          if (cameraStatus !== 'active') {
            toggleCamera();
          }
        }}
        onDismiss={dismissReminder}
      />
    </div>
  );
};

export default App;
