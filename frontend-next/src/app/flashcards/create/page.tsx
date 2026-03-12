'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import djangoApi from '@/services/api';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';

const FLASHCARD_PREFILL_KEY = 'lamla_flashcards_prefill';

export default function FlashcardCreatePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLASHCARD_PREFILL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { sourceText?: string; title?: string; subject?: string };

      if (typeof parsed.title === 'string' && parsed.title.trim()) {
        setTitle(parsed.title.trim());
      }
      if (typeof parsed.subject === 'string' && parsed.subject.trim()) {
        setSubject(parsed.subject.trim());
      }
      if (typeof parsed.sourceText === 'string' && parsed.sourceText.trim()) {
        setSourceText(parsed.sourceText.trim());
      }

      if (parsed.sourceText || parsed.title || parsed.subject) {
        toast.success('Imported content from AI Tutor. You can edit before generating.');
      }
    } catch {
      // Ignore malformed prefill payload
    } finally {
      localStorage.removeItem(FLASHCARD_PREFILL_KEY);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) { toast.error('Please enter source text.'); return; }
    setGenerating(true);
    try {
      const res = await djangoApi.post('/flashcards/generate/', {
        title,
        subject,
        source_text: sourceText,
        num_cards: numCards,
      });
      router.push(`/flashcards/deck/${res.data.id}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create flashcard deck.'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Create Flashcard Deck</h1>
          <p className="text-muted-foreground">Generate AI-powered flashcards from your study material.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Deck Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology Chapter 5" required
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Subject (optional)</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology"
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Source Text</label>
              <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={8}
                placeholder="Paste your study material here..." required
                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Number of cards: {numCards}</label>
              <input type="range" min={5} max={30} value={numCards} onChange={(e) => setNumCards(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>30</span></div>
            </div>
          </div>

          <button type="submit" disabled={generating}
            className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {generating ? 'Generating Deck...' : 'Generate Flashcards'}
          </button>
        </form>
      </main>
    </div>
  );
}
