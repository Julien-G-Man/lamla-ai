'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import djangoApi from '@/services/api';
import MathRenderer from '@/components/MathRenderer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FlashcardDeckPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!params.id) return;
    djangoApi.get(`/flashcards/${params.id}/`)
      .then((res) => setDeck(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  const cards = deck?.cards || deck?.flashcards || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/flashcards" className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{deck?.title || 'Flashcard Deck'}</h1>
            <p className="text-sm text-muted-foreground">{cards.length} cards · {deck?.subject || ''}</p>
          </div>
          <Link href={`/flashcards/study/${params.id}`}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Study Now
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card: any, i: number) => (
            <div key={card.id || i} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
              <p className="text-xs text-muted-foreground font-medium">Card {i + 1}</p>
              <div className="font-medium text-sm">
                <MathRenderer text={card.front || card.question} />
              </div>
              <div className="h-px bg-border my-1" />
              <div className="text-sm text-muted-foreground">
                <MathRenderer text={card.back || card.answer} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
