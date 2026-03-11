'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Image from 'next/image';
import { Eye, EyeOff, Sparkles, Brain, Layers, Bot, AlertCircle } from 'lucide-react';

const brandFeatures = [
  { icon: Brain, label: 'AI Quiz Generator', desc: 'Turn notes into practice questions instantly' },
  { icon: Bot, label: 'Personal AI Tutor', desc: 'Get answers and explanations 24/7' },
  { icon: Layers, label: 'Smart Flashcards', desc: 'Build and review decks in minutes' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, googleAuth } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user } = await login(identifier, password);
      const role = user?.is_admin ? 'admin' : 'user';
      router.push(role === 'admin' ? '/admin-dashboard' : '/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (token: string) => {
    setError('');
    setIsLoading(true);
    try {
      const { user } = await googleAuth(token);
      const role = user?.is_admin ? 'admin' : 'user';
      router.push(role === 'admin' ? '/admin-dashboard' : '/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-center w-5/12 relative overflow-hidden px-12 py-16">
        {/* Background */}
        <div className="absolute inset-0 gradient-bg opacity-95" />
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <Image src="/lamla_logo.png" alt="Lamla AI" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-white">Lamla.ai</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Study Smarter<br />with AI
            </h1>
            <p className="text-white/70 mt-3 text-base leading-relaxed">
              AI-powered quizzes, flashcards, and tutoring — all from your own study materials.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {brandFeatures.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/60 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/lamla_logo.png" alt="Lamla AI" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold gradient-text">Lamla.ai</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to continue learning</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Email or Username</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                required
                className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg gradient-bg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 glow-blue-sm"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <GoogleSignInButton onSuccess={handleGoogleSuccess} />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
