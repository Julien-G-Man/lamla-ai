'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MathRenderer from '@/components/MathRenderer';
import djangoApi from '@/services/api';
import { Flag, Clock, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: number;
  question: string;
  options?: string[];
  type: 'mcq' | 'short_answer';
}

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPlayPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    const stored = localStorage.getItem('current_quiz');
    if (!stored) { router.push('/quiz/create'); return; }
    const q = JSON.parse(stored);
    setQuiz(q);
    setQuestions(q.questions || []);
    setTimeLeft((q.time_limit_minutes || 30) * 60);
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await djangoApi.post('/quiz/submit/', { quiz_id: quiz?.id, answers });
      localStorage.setItem('quiz_results', JSON.stringify(res.data));
      localStorage.removeItem('current_quiz');
      router.push('/quiz/results');
    } catch {
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, router, submitting]);

  useEffect(() => {
    if (!quiz) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, handleSubmit]);

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles size={18} className="animate-pulse text-primary" />
          Loading quiz...
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        {/* Progress bar */}
        <div className="h-0.5 gradient-bg transition-all duration-500" style={{ width: `${progress}%` }} />
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{quiz.subject || 'Quiz'}</p>
            <p className="text-xs text-muted-foreground">
              {answeredCount} / {questions.length} answered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTimer(!showTimer)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                timeLeft < 120
                  ? 'border-destructive text-destructive bg-destructive/10'
                  : 'border-border text-muted-foreground hover:bg-surface-hover'
              )}
            >
              <Clock size={12} />
              {showTimer ? formatTime(timeLeft) : '—:——'}
            </button>
            <button
              onClick={() => confirm('Submit quiz now?') && handleSubmit()}
              disabled={submitting}
              className="px-4 py-1.5 rounded-md gradient-bg text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-24 pb-8 flex flex-col gap-5">
        {/* Question navigator */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-8 h-8 rounded-md text-xs font-semibold transition-all',
                i === currentIndex
                  ? 'gradient-bg text-white glow-blue-sm'
                  : flagged.has(i)
                  ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-500'
                  : answers[i] !== undefined
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'border border-border hover:bg-surface-hover text-muted-foreground'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        {q && (
          <div className="glass rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-xs font-semibold text-primary/70 tracking-wide">
                  QUESTION {currentIndex + 1} OF {questions.length}
                </span>
                <div className="mt-2 text-base font-medium leading-relaxed">
                  <MathRenderer text={q.question} />
                </div>
              </div>
              <button
                onClick={() => toggleFlag(currentIndex)}
                className={cn(
                  'p-2 rounded-md transition-colors shrink-0',
                  flagged.has(currentIndex)
                    ? 'text-yellow-400 bg-yellow-400/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                )}
              >
                <Flag size={16} />
              </button>
            </div>

            {q.type === 'mcq' && q.options ? (
              <div className="flex flex-col gap-2.5">
                {q.options.map((option: string, i: number) => {
                  const selected = answers[currentIndex] === option;
                  return (
                    <label
                      key={i}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
                        selected
                          ? 'border-primary bg-primary/10 glow-blue-sm'
                          : 'border-border hover:border-primary/40 hover:bg-surface-hover'
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                        selected ? 'gradient-bg text-white' : 'bg-surface text-muted-foreground border border-border'
                      )}>
                        {LETTERS[i]}
                      </div>
                      <input
                        type="radio"
                        name={`q-${currentIndex}`}
                        value={option}
                        checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [currentIndex]: option }))}
                        className="hidden"
                      />
                      <span className="text-sm"><MathRenderer text={option} /></span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={answers[currentIndex] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentIndex]: e.target.value }))}
                rows={4}
                placeholder="Type your answer here..."
                className="px-4 py-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none placeholder:text-muted-foreground"
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {isLast ? (
            <button
              onClick={() => confirm('Submit quiz now?') && handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 glow-blue-sm"
            >
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
