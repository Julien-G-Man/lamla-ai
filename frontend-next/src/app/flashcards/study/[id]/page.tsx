'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import djangoApi from '@/services/api';
import MathRenderer from '@/components/MathRenderer';
import { RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

export default function FlashcardStudyPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!params.id) return;
    djangoApi.get(`/flashcards/${params.id}/`)
      .then((res) => {
        setDeck(res.data);
        setCards(res.data.cards || res.data.flashcards || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleRating = async (rating: 'easy' | 'medium' | 'hard') => {
    const card = cards[currentIndex];
    try {
      await djangoApi.post(`/flashcards/card/${card.id}/rate/`, { rating });
    } catch { /* non-critical */ }
    if (currentIndex >= cards.length - 1) {
      setDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles size={18} className="animate-pulse text-primary" />
          Loading deck...
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  if (done) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar brandOnly />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="glass rounded-2xl p-12 text-center flex flex-col items-center gap-6 max-w-sm w-full">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center glow-blue text-3xl">
              🎉
            </div>
            <div>
              <h1 className="text-2xl font-bold">Session Complete!</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                You reviewed all {cards.length} cards.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setCurrentIndex(0); setFlipped(false); setDone(false); }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm font-medium"
              >
                <RotateCcw size={14} /> Again
              </button>
              <Link
                href="/flashcards"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                All Decks <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="h-0.5 gradient-bg transition-all duration-500" style={{ width: `${progress}%` }} />
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{deck?.title}</p>
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} / {cards.length}
            </p>
          </div>
          <Link
            href="/flashcards"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-24 pb-8 flex flex-col gap-6 items-center justify-center">

        {/* Progress dots */}
        <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
          {cards.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                i < currentIndex
                  ? 'gradient-bg'
                  : i === currentIndex
                  ? 'bg-primary scale-125'
                  : 'bg-border'
              )}
            />
          ))}
        </div>

        {/* Card with flip */}
        {card && (
          <div
            className="w-full perspective-1000 cursor-pointer"
            style={{ perspective: '1000px' }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: '280px',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 glass rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="text-xs font-semibold text-primary/60 tracking-widest mb-4">QUESTION</span>
                <div className="text-lg font-medium leading-relaxed">
                  <MathRenderer text={card.front || card.question} />
                </div>
                <p className="text-xs text-muted-foreground mt-6">Click to reveal answer</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 glass rounded-2xl p-8 flex flex-col items-center justify-center text-center border-l-4 border-primary"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className="text-xs font-semibold text-primary/60 tracking-widest mb-4">ANSWER</span>
                <div className="text-lg font-medium leading-relaxed">
                  <MathRenderer text={card.back || card.answer} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {flipped ? (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleRating('hard')}
              className="flex-1 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold"
            >
              Hard
            </button>
            <button
              onClick={() => handleRating('medium')}
              className="flex-1 py-3 rounded-xl border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10 transition-colors text-sm font-semibold"
            >
              Medium
            </button>
            <button
              onClick={() => handleRating('easy')}
              className="flex-1 py-3 rounded-xl border border-green-500/40 text-green-400 hover:bg-green-500/10 transition-colors text-sm font-semibold"
            >
              Easy ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="px-8 py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity glow-blue-sm"
          >
            Reveal Answer
          </button>
        )}

        <p className="text-xs text-muted-foreground">
          Keyboard: Space to flip · 1 = Hard · 2 = Medium · 3 = Easy
        </p>
      </main>
    </div>
  );
}
