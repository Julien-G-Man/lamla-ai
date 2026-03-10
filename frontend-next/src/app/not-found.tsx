'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
        <h1 className="text-8xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
          Go Home
        </Link>
      </main>
    </div>
  );
}
