'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Sparkles, CheckCircle2, Play } from 'lucide-react';
import FloatingStudyIcons from '@/components/FloatingStudyIcons';

function ProductMockup() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-10 px-2">
      <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
          </div>
          <div className="flex-1 mx-3 h-4 rounded bg-background/60 flex items-center px-2.5">
            <div className="w-16 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>
        </div>
        {/* Content */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {/* Quiz panel */}
          <div className="rounded-xl border border-border bg-background p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Quiz</span>
            </div>
            <p className="text-[10px] font-semibold text-foreground/80 leading-tight">
              What organelle produces ATP in a cell?
            </p>
            {['Nucleus', 'Mitochondria', 'Ribosome'].map((opt, i) => (
              <div
                key={opt}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[9px] border ${
                  i === 1
                    ? 'bg-primary/12 border-primary/30 text-primary font-semibold'
                    : 'bg-muted/20 border-border/40 text-muted-foreground'
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${i === 1 ? 'bg-primary' : 'bg-border'}`} />
                {opt}
              </div>
            ))}
            <div className="flex justify-end mt-1">
              <div className="px-3 py-1 rounded-md bg-primary text-white text-[9px] font-semibold">Submit</div>
            </div>
          </div>
          {/* AI Tutor panel */}
          <div className="rounded-xl border border-border bg-background p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">AI Tutor</span>
            </div>
            <div
              className="self-end rounded-xl rounded-br-sm px-2 py-1.5 bg-primary/15 border border-primary/20 text-[9px] text-foreground/70 max-w-[90%] leading-relaxed"
            >
              Explain photosynthesis
            </div>
            <div
              className="self-start rounded-xl rounded-bl-sm px-2 py-1.5 bg-muted/40 border border-border/40 text-[9px] text-muted-foreground max-w-[95%] leading-relaxed"
            >
              Photosynthesis converts sunlight + CO₂ into glucose using chlorophyll...
            </div>
            <div className="mt-auto flex items-center gap-1.5 border border-border rounded-lg px-2 py-1 mt-2">
              <div className="flex-1 h-1.5 rounded bg-muted-foreground/15" />
              <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center shrink-0">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><path d="M1 4h6M4 1l3 3-3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <span className="text-primary">with AI</span>
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
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-primary text-white font-semibold hover:opacity-90 active:scale-95 transition-all duration-150 glow-blue text-base"
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

        {/* Product illustration */}
        {/* <ProductMockup /> */}
      </div>
    </section>
  );
}
