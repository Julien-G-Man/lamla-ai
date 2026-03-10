'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { dashboardService } from '@/services/dashboard';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';

export default function AdminRatingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() !== 'admin') router.push('/dashboard');
  }, [isLoading, isAuthenticated, router, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    dashboardService.getAdminQuizFeedback(100)
      .then(setFeedbackData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, getUserRole]);

  const ratings = feedbackData?.ratings || feedbackData?.feedback || [];
  const summary = feedbackData?.summary;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/admin-dashboard" className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-2xl font-bold">Quiz Ratings</h1>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Average Rating</p>
              <div className="flex items-center justify-center gap-1">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xl font-bold">{summary.average_rating?.toFixed(1) ?? '—'}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Ratings</p>
              <span className="text-xl font-bold">{summary.total_ratings ?? '—'}</span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">5-Star Rate</p>
              <span className="text-xl font-bold">{summary.five_star_percent != null ? `${summary.five_star_percent}%` : '—'}</span>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <p className="p-4 text-muted-foreground">Loading ratings...</p>
          ) : ratings.length === 0 ? (
            <p className="p-4 text-muted-foreground">No ratings yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {ratings.map((r: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{r.user || r.username || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{r.source || 'Quiz'} · {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={14} className={j < (r.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
