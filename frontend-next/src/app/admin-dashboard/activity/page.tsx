'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { dashboardService } from '@/services/dashboard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminActivityPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() !== 'admin') router.push('/dashboard');
  }, [isLoading, isAuthenticated, router, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    setLoading(true);
    dashboardService.getAdminActivity({ period })
      .then((data) => setActivities(data.activities || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, getUserRole, period]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/admin-dashboard" className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
        </div>

        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <p className="p-4 text-muted-foreground">Loading activities...</p>
          ) : activities.length === 0 ? (
            <p className="p-4 text-muted-foreground">No activity found for this period.</p>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((a: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{a.action || a.type || 'Activity'}</p>
                    <p className="text-xs text-muted-foreground">{a.user || a.username} · {a.description || ''}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
