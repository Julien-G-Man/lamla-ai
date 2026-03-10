'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MathRenderer from '@/components/MathRenderer';
import Link from 'next/link';
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function QuizResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('quiz_results');
    if (!stored) { router.push('/quiz/create'); return; }
    setResults(JSON.parse(stored));
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  const score = results.score_percent ?? results.score ?? 0;
  const questions = results.questions || results.results || [];

  const scoreColor =
    score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
  const scoreGlow =
    score >= 80 ? 'glow-cyan' : score >= 60 ? '' : '';

  /* SVG arc for score ring */
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar brandOnly />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-8">

        {/* Score card */}
        <div className={`glass rounded-2xl p-8 flex flex-col items-center text-center gap-4 ${scoreGlow}`}>
          <div className="relative w-36 h-36">
            <svg width="144" height="144" className="-rotate-90">
              <circle cx="72" cy="72" r={radius} fill="none" stroke="oklch(0.24 0.025 255)" strokeWidth="10" />
              <circle
                cx="72" cy="72" r={radius}
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            <h1 className="text-2xl font-bold">Quiz Complete!</h1>
          </div>

          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{results.correct_answers ?? '—'}</span>
            {' / '}
            <span className="font-semibold text-foreground">{results.total_questions ?? questions.length}</span>
            {' '} questions correct
          </p>

          {results.feedback && (
            <p className="text-sm text-muted-foreground italic max-w-xs">{results.feedback}</p>
          )}

          <div className="flex gap-3 mt-2 flex-wrap justify-center">
            <Link
              href="/quiz/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-bg text-white font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              <RotateCcw size={14} /> New Quiz
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors font-semibold text-sm"
            >
              Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Question review */}
        {questions.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-lg">Review</h2>
            {questions.map((q: any, i: number) => {
              const isCorrect = q.is_correct ?? q.correct;
              return (
                <div
                  key={i}
                  className={`glass rounded-xl p-4 flex flex-col gap-2 border-l-4 ${
                    isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect
                      ? <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />
                      : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <MathRenderer text={q.question} />
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your answer:{' '}
                        <span className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {q.user_answer || q.your_answer || '—'}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-xs text-green-400 mt-0.5">
                          Correct: <span className="font-medium">{q.correct_answer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
