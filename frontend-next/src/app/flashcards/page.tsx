'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import djangoApi from '@/services/api';
import { Plus, Layers, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const DECK_COLORS = [
  'bg-blue-500/12',
  'bg-violet-500/12',
  'bg-cyan-500/12',
  'bg-indigo-500/12',
  'bg-sky-500/12',
  'bg-teal-500/12',
];

export default function FlashcardDecksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    djangoApi.get('/flashcards/')
      .then((res) => setDecks(res.data.decks || res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const dueToday = decks.filter((d: any) => d.due_count > 0).length;

  return (
    <AppLayout title="Flashcards">
      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            {dueToday > 0 && (
              <p className="text-sm text-primary mt-0.5">
                {dueToday} deck{dueToday > 1 ? 's' : ''} due for review today
              </p>
            )}
          </div>
          <Link
            href="/flashcards/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity glow-blue-sm"
          >
            <Plus size={14} /> New Deck
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="glass rounded-2xl text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">No flashcard decks yet</h2>
              <p className="text-muted-foreground text-sm mt-1">Create your first deck to start studying.</p>
            </div>
            <Link
              href="/flashcards/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Sparkles size={14} /> Create First Deck
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck: any, idx: number) => {
              const color = DECK_COLORS[idx % DECK_COLORS.length];
              const cardCount = deck.card_count ?? deck.flashcard_count ?? 0;
              return (
                <div
                  key={deck.id}
                  className="glass rounded-xl p-5 flex flex-col gap-4 card-hover group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                      <BookOpen size={18} className="text-primary" />
                    </div>
                    {deck.due_count > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full gradient-bg text-white font-semibold">
                        {deck.due_count} due
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {deck.title || deck.subject || 'Untitled Deck'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{cardCount} cards</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/flashcards/study/${deck.id}`}
                      className="flex-1 text-center py-2 rounded-lg gradient-bg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      Study
                    </Link>
                    <Link
                      href={`/flashcards/deck/${deck.id}`}
                      className="flex-1 text-center py-2 rounded-lg border border-border text-xs font-medium hover:bg-surface-hover transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
