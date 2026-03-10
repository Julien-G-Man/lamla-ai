'use client';

import { useEffect } from 'react';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <LayoutDashboard className="w-7 h-7 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Dashboard failed to load</h2>
          <p className="text-muted-foreground text-sm">
            There was a problem loading your dashboard data.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
