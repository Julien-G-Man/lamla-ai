'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Our team has been notified.
          </p>
          {process.env.NODE_ENV !== 'production' && error?.message && (
            <p className="mt-2 text-xs font-mono bg-muted rounded px-3 py-2 text-left text-muted-foreground break-all">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
          >
            <Home size={14} />
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}
