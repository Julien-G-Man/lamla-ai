'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Sparkles, CheckCircle2, Play } from 'lucide-react';
import FloatingStudyIcons from '@/components/FloatingStudyIcons';

export default function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-32 min-h-screen overflow-hidden">

      {/* ── Layer 0: soft radial gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 90% 60% at 50% 0%, oklch(0.62 0.22 245 / 0.12), transparent 70%)',
            'radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.78 0.16 195 / 0.07), transparent 60%)',
          ].join(', '),
        }}
      />

      {/* ── Layer 1: subtle grid ── */}
      <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />

      {/* ── Layer 2: floating study icons (behind content) ── */}
      <div className="absolute inset-0 z-0">
        <FloatingStudyIcons />
      </div>

      {/* ── Layer 3: hero content ── */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm">
          <Sparkles size={14} />
          AI-Powered Learning Platform
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]">
          Learn Smarter
          <br />
          <span className="gradient-text-strong">with AI</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Upload your study materials and instantly transform them into quizzes,
          flashcards, and personalised AI tutoring.{' '}
          <span className="text-foreground font-medium">Study smarter. Perform better.</span>
        </p>

        {/* CTA buttons */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href={isAuthenticated ? '/quiz/create' : '/auth/signup'}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg gradient-bg text-white font-semibold hover:opacity-90 active:scale-95 transition-all duration-150 glow-blue text-base"
          >
            {isAuthenticated ? 'Start Practising' : 'Get Started Free'}
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg border border-border bg-surface/80 backdrop-blur-sm hover:bg-surface-hover active:scale-95 transition-all duration-150 font-semibold text-base"
          >
            <Play size={15} className="text-primary" />
            Try Demo
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground mt-2">
          {['No credit card required', 'Free to start', 'AI-powered'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Bottom fade into next section ── */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none bg-linear-to-t from-background to-transparent" />
    </section>
  );
}
