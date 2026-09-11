import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, BrainCircuit, HeartHandshake, Wind } from 'lucide-react';
import { ChatMessage, FaceData } from '../lib/types';
import { getEmotionMeta } from '../lib/emotions';
import {
  getSuggestedPrompts,
  detectProactiveCheckIn,
  formatCameraContext,
  generateCompanionResponse,
  getSuggestedExercise,
  Exercise,
} from '../lib/companion';
import { cn } from '../lib/utils';

interface ChatSectionProps {
  faceData: FaceData | null;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  content:
    "Hi, I'm EmoSense. I can see your facial expressions in real time, so you don't need to explain how you're feeling — I can already pick up on it. Just start talking and I'll respond to what I see and hear from you.",
  timestamp: new Date(),
};

function ExerciseModal({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(
    exercise.phases ? exercise.phases[0].duration : 4
  );
  const [cycle, setCycle] = useState(1);

  useEffect(() => {
    if (!exercise.phases) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPhaseIndex((p) => {
            const nextP = (p + 1) % exercise.phases!.length;
            if (nextP === 0) setCycle((c) => c + 1);
            return nextP;
          });
          return exercise.phases![(phaseIndex + 1) % exercise.phases!.length].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [exercise.phases, phaseIndex]);

  const currPhase = exercise.phases ? exercise.phases[phaseIndex] : null;

  return (
    <div className="p-4 rounded-xl bg-card border border-primary/30 shadow-lg my-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">{exercise.name}</h4>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Dismiss
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{exercise.intro}</p>

      {currPhase ? (
        <div className="flex flex-col items-center justify-center py-4 bg-background/50 rounded-lg border border-border">
          <motion.div
            animate={{ scale: currPhase.name.includes('in') ? 1.3 : currPhase.name.includes('out') ? 0.8 : 1 }}
            transition={{ duration: currPhase.duration, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-2"
          >
            <span className="text-2xl font-bold font-mono text-primary">
              {countdown}
            </span>
          </motion.div>
          <div className="text-sm font-semibold">{currPhase.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {currPhase.instruction}
          </div>
          <div className="text-[10px] text-muted-foreground/70 mt-2">
            Cycle {cycle} of {exercise.cycles || 4}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 py-2">
          {exercise.steps?.map((step) => (
            <div key={step.count} className="text-xs flex gap-2 items-start">
              <span className="font-bold text-primary">{step.count}.</span>
              <span>{step.instruction}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const ChatSection: React.FC<ChatSectionProps> = ({ faceData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevFaceDataRef = useRef<FaceData | null>(null);
  const lastProactiveTimeRef = useRef<number>(Date.now());

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update suggestions based on emotion
  useEffect(() => {
    if (faceData?.faceDetected) {
      setSuggestions(getSuggestedPrompts(faceData));
    }
  }, [faceData?.dominantEmotion, faceData?.behavioralState]);

  // Proactive empathy check-in loop
  useEffect(() => {
    const checkInterval = 25000;
    const now = Date.now();

    if (now - lastProactiveTimeRef.current >= checkInterval) {
      const proactiveMsg = detectProactiveCheckIn(
        prevFaceDataRef.current,
        faceData
      );

      if (proactiveMsg) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'proactive',
            content: proactiveMsg,
            timestamp: new Date(),
          },
        ]);
        lastProactiveTimeRef.current = now;

        // Check if an exercise would be beneficial
        const exercise = getSuggestedExercise(faceData);
        if (exercise && !activeExercise) {
          setActiveExercise(exercise);
        }
      }
    }

    prevFaceDataRef.current = faceData;
  }, [faceData, activeExercise]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userContext = faceData
        ? {
            emotion: faceData.dominantEmotion,
            state: faceData.behavioralState,
            trend: faceData.emotionTrend,
          }
        : undefined;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
        context: userContext,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);

      // Simulate thoughtful response time
      const delay = 900 + Math.random() * 600;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const aiText = generateCompanionResponse(faceData);
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: aiText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    },
    [faceData, isTyping]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isProactive = msg.role === 'proactive';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn(
                'flex gap-2.5 max-w-[85%]',
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs border shadow-xs',
                  isUser
                    ? 'bg-primary text-white border-primary/50'
                    : isProactive
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-card text-primary border-border'
                )}
              >
                {isUser ? (
                  'You'
                ) : isProactive ? (
                  <HeartHandshake className="w-3.5 h-3.5" />
                ) : (
                  <BrainCircuit className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1">
                <div
                  className={cn(
                    'p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-tr-xs'
                      : isProactive
                      ? 'bg-amber-500/10 border border-amber-500/25 text-foreground rounded-tl-xs'
                      : 'bg-card/90 border border-border text-foreground rounded-tl-xs'
                  )}
                >
                  {msg.content}
                </div>

                {/* Context badge if provided */}
                {msg.context && isUser && (
                  <div className="text-[10px] text-muted-foreground/60 self-end flex items-center gap-1 font-mono">
                    <span>
                      {getEmotionMeta(msg.context.emotion).emoji}{' '}
                      {getEmotionMeta(msg.context.emotion).label}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Active interactive exercise card */}
        {activeExercise && (
          <ExerciseModal
            exercise={activeExercise}
            onClose={() => setActiveExercise(null)}
          />
        )}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground py-1"
          >
            <div className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center">
              <BrainCircuit className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <span className="italic">EmoSense is listening...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border/50 bg-card/20">
          <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-primary/70" />
            Suggested:
          </span>
          {suggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-card/80 border border-border hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground cursor-pointer truncate max-w-[260px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Camera Context Indicator & Input Bar */}
      <div className="p-4 border-t border-border bg-card/40 backdrop-blur-sm">
        {faceData?.faceDetected && (
          <div className="text-[10px] text-muted-foreground/80 mb-2 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatCameraContext(faceData)}</span>
          </div>
        )}

        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share how you're feeling..."
            disabled={isTyping}
            className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/60 text-xs placeholder:text-muted-foreground transition-all shadow-inner"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className={cn(
              'absolute right-1.5 p-2 rounded-lg text-primary transition-all cursor-pointer',
              !inputValue.trim() || isTyping
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-primary/10'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
