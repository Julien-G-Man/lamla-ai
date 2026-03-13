'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import FloatingContactIcons from '@/components/FloatingContactIcons';
import { useAuth } from '@/context/AuthContext';
import djangoApi from '@/services/api';
import {
  Bot,
  Brain,
  Layers,
  FolderOpen,
  BarChart3,
  Microscope,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
  Target,
  BookOpen,
} from 'lucide-react';

const features = [
  {
    href: '/quiz/create',
    icon: Brain,
    title: 'Quiz Generator',
    desc: 'Automatically generate multiple-choice questions from your study materials in seconds.',
    iconColor: 'text-blue-400',
    accentBg: 'bg-blue-500/[0.08]',
  },
  {
    href: '/ai-tutor',
    icon: Bot,
    title: 'AI Tutor',
    desc: 'Get instant answers, deeper explanations, and concept breakdowns from your personal AI.',
    iconColor: 'text-cyan-400',
    accentBg: 'bg-cyan-500/[0.08]',
  },
  {
    href: '/flashcards',
    icon: Layers,
    title: 'Flashcards',
    desc: 'Create and study AI-generated flashcard decks for rapid-fire review and retention.',
    iconColor: 'text-violet-400',
    accentBg: 'bg-violet-500/[0.08]',
  },
  {
    href: '/ai-tutor',
    icon: Microscope,
    title: 'Exam Analysis',
    desc: 'Upload past exams or slides for instant topic breakdowns and targeted feedback.',
    iconColor: 'text-indigo-400',
    accentBg: 'bg-indigo-500/[0.08]',
  },
  {
    href: '/dashboard',
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Track your progress over time and pinpoint exactly where to focus your efforts.',
    iconColor: 'text-sky-400',
    accentBg: 'bg-sky-500/[0.08]',
  },
  {
    href: '/materials',
    icon: FolderOpen,
    title: 'Study Materials',
    desc: "Browse community-uploaded materials or upload your own slides and notes.",
    iconColor: 'text-teal-400',
    accentBg: 'bg-teal-500/[0.08]',
  },
];

const stats = [
  {
    value: 50,
    suffix: '+',
    label: 'Active Students',
    hint: 'Learners practicing every week',
    icon: BookOpen,
    progress: '62%',
  },
  {
    value: 250,
    suffix: '+',
    label: 'Quizzes Generated',
    hint: 'AI-created sets across subjects',
    icon: Layers,
    progress: '78%',
  },
  {
    value: 92,
    suffix: '%',
    label: 'Average Success Rate',
    hint: 'Students reporting better scores',
    icon: Target,
    progress: '92%',
  },
  {
    value: 3,
    suffix: '+',
    label: 'AI Study Modes',
    hint: 'Tutor, Quizzes, and Flashcards',
    icon: Sparkles,
    progress: '55%',
  },
];

function AnimatedStatNumber({
  value,
  suffix,
  start,
  duration = 1200,
}: {
  value: number;
  suffix: string;
  start: boolean;
  duration?: number;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!start) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const reducedMotionFrame = requestAnimationFrame(() => setCurrent(value));
      return () => cancelAnimationFrame(reducedMotionFrame);
    }

    let rafId = 0;
    let startTime = 0;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCurrent(Math.round(eased * value));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [start, value, duration]);

  return (
    <>
      {current}
      {suffix}
    </>
  );
}

function StatCard({ stat, index }: { stat: (typeof stats)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        scale: 1.03,
        boxShadow: '0 20px 60px -10px oklch(0.62 0.22 245 / 0.3)',
        transition: { duration: 0.2 },
      }}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface/85 backdrop-blur-sm p-7 flex flex-col gap-5 cursor-default"
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-primary/30" />

      {/* Icon */}
      <div className="relative flex items-center justify-between">
        <motion.div
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl glass"
          whileHover={{ scale: 1.15, rotate: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <stat.icon size={20} className="text-primary" />
        </motion.div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
          Live
        </span>
      </div>

      {/* Number + labels */}
      <div className="relative">
        <p className="text-4xl md:text-5xl font-bold tracking-tight gradient-text-strong">
          <AnimatedStatNumber value={stat.value} suffix={stat.suffix} start={isInView} />
        </p>
        <p className="mt-1.5 text-sm font-semibold text-foreground">{stat.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
      </div>

      {/* Animated progress bar */}
      <div className="relative h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: isInView ? stat.progress : '0%' }}
          transition={{
            duration: 1.2,
            delay: index * 0.15 + 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════ Feature card mini-mockups ═══════════════════════════

function QuizMockup() {
  const opts = ['Mitochondria', 'Nucleus', 'Ribosome'];
  return (
    <div className="flex flex-col gap-2 w-40">
      {opts.map((opt, i) => (
        <motion.div
          key={opt}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[11px] border ${
            i === 1
              ? 'bg-primary/[0.14] border-primary/30'
              : 'bg-muted/30 border-border/50'
          }`}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.18 + 0.1, duration: 0.45, ease: 'easeOut' }}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full shrink-0 border flex items-center justify-center ${
              i === 1 ? 'border-primary' : 'border-border'
            }`}
          >
            {i === 1 && (
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.65, type: 'spring', stiffness: 450 }}
              />
            )}
          </div>
          <span className={i === 1 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}>
            {opt}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function TutorMockup() {
  return (
    <div className="flex flex-col gap-2 w-44">
      <motion.div
        className="self-end text-[11px] px-3 py-2 bg-primary/20 border border-primary/25 text-foreground/80 leading-relaxed"
        style={{ borderRadius: '14px 14px 3px 14px' }}
        initial={{ opacity: 0, scale: 0.88, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        Explain photosynthesis
      </motion.div>
      <motion.div
        className="self-start text-[11px] px-3 py-2 bg-muted/50 border border-border/50 text-muted-foreground"
        style={{ borderRadius: '14px 14px 14px 3px' }}
        initial={{ opacity: 0, scale: 0.88, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
      >
        <span className="flex gap-1 items-center h-3.5">
          {[0, 1, 2].map((j) => (
            <motion.span
              key={j}
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.65, repeat: Infinity, delay: j * 0.15 }}
            />
          ))}
        </span>
      </motion.div>
    </div>
  );
}

function FlashcardMockup() {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setFlipped((f) => !f), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-36 h-20">
      <div
        className="absolute inset-0 rounded-2xl bg-primary/[0.06] border border-primary/[0.12]"
        style={{ transform: 'translate(5px, 5px)' }}
      />
      <div className="absolute inset-0" style={{ perspective: '650px' }}>
        <motion.div
          className="w-full h-full rounded-2xl bg-primary/[0.14] border border-primary/25 flex items-center justify-center text-[11px] font-medium"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center text-foreground/75"
            style={{ backfaceVisibility: 'hidden' }}
          >
            What is ATP?
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center text-primary font-semibold"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            Energy currency
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ExamMockup() {
  return (
    <div className="relative w-32 h-24 rounded-xl bg-muted/30 border border-border/50 p-3.5 overflow-hidden">
      {[100, 72, 88, 55].map((w, i) => (
        <motion.div
          key={i}
          className="h-1.5 rounded-full bg-foreground/10 mb-2.5"
          style={{ width: `${w}%`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: i * 0.1 + 0.15, duration: 0.5, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-primary/50"
        animate={{ top: ['12%', '86%', '12%'] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function AnalyticsMockup() {
  const heights = [45, 72, 38, 95, 60, 78, 55];
  return (
    <div className="flex items-end gap-1.5 h-16 w-36">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 h-full flex items-end">
          <motion.div
            className={`w-full rounded-t-sm ${i === 3 ? 'bg-primary' : 'bg-primary/[0.38]'}`}
            style={{ height: `${h}%`, transformOrigin: 'bottom' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.08 + 0.15, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      ))}
    </div>
  );
}

function MaterialsMockup() {
  const cards = [
    { scale: 1.0, topPct: '24%', opacity: 0.2, delay: 0.3 },
    { scale: 0.88, topPct: '12%', opacity: 0.14, delay: 0.15 },
    { scale: 0.76, topPct: '0%', opacity: 0.08, delay: 0 },
  ];
  return (
    <div className="relative h-20 w-36">
      {cards.map(({ scale, topPct, opacity, delay }, i) => (
        <motion.div
          key={i}
          className="absolute rounded-xl border border-primary/20 bg-primary/[0.1]"
          style={{
            width: `${scale * 100}%`,
            height: '58%',
            top: topPct,
            left: `${((1 - scale) / 2) * 100}%`,
            opacity,
            zIndex: cards.length - i,
          }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity }}
          transition={{ delay, duration: 0.45, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════ Feature card ═══════════════════════════

function FeatureCard({
  feat,
  className = '',
  delay = 0,
}: {
  feat: (typeof features)[number];
  className?: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const visual = (() => {
    switch (feat.title) {
      case 'Quiz Generator':        return <QuizMockup />;
      case 'AI Tutor':              return <TutorMockup />;
      case 'Flashcards':            return <FlashcardMockup />;
      case 'Exam Analysis':         return <ExamMockup />;
      case 'Performance Analytics': return <AnalyticsMockup />;
      default:                      return <MaterialsMockup />;
    }
  })();

  return (
    <motion.div
      ref={cardRef}
      className={`group relative ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cursor-tracked glow border */}
      <div
        className="absolute -inset-[1px] rounded-3xl pointer-events-none transition-opacity duration-500"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, oklch(0.62 0.22 245 / 0.55), transparent 52%)`,
        }}
      />

      <Link
        href={feat.href}
        className="relative flex flex-col h-full rounded-3xl overflow-hidden bg-card border border-white/[0.07] transition-colors duration-300 hover:border-primary/[0.18]"
      >
        {/* Inner spotlight */}
        <div
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, oklch(0.62 0.22 245 / 0.055), transparent 52%)`,
          }}
        />

        {/* Visual area */}
        <div className={`relative min-h-[180px] flex items-center justify-center overflow-hidden ${feat.accentBg}`}>
          {/* Blurred decorative icon */}
          <feat.icon size={110} className="absolute text-primary/[0.05] pointer-events-none" strokeWidth={0.75} />
          {/* Corner glow */}
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-primary/[0.06] blur-2xl pointer-events-none" />
          {visual}
        </div>

        {/* Text area */}
        <div className="px-5 py-5 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <feat.icon size={13} className={feat.iconColor} />
              <h3 className="font-semibold text-[15px] text-foreground leading-snug">{feat.title}</h3>
            </div>
            <motion.div
              className="flex items-center gap-1 shrink-0 mt-px text-primary/60 font-semibold"
              style={{ fontSize: '11px' }}
              animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -6 }}
              transition={{ duration: 0.18 }}
            >
              Explore <ArrowRight size={10} />
            </motion.div>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{feat.desc}</p>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════ Features section ═══════════════════════════

function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 px-4 overflow-hidden bg-background">
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_top,transparent,var(--background))] z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--background))] z-20" />
      {/* Ambient glows */}
      <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full bg-primary/[0.09] blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full bg-violet-500/[0.07] blur-[140px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <motion.p
            className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            Features
          </motion.p>
          <motion.h2
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Smart Tools for{' '}
            <span className="gradient-text">Smart Students</span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground mt-4 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything you need to study more effectively, all powered by the latest AI.
          </motion.p>
        </div>

        {/* Asymmetric bento grid — alternating large/small */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Row 1: large (4) + small (2) */}
          <FeatureCard feat={features[0]} className="lg:col-span-4" delay={0} />
          <FeatureCard feat={features[1]} className="lg:col-span-2" delay={0.1} />
          {/* Row 2: small (2) + large (4) */}
          <FeatureCard feat={features[2]} className="lg:col-span-2" delay={0.2} />
          <FeatureCard feat={features[3]} className="lg:col-span-4" delay={0.3} />
          {/* Row 3: equal halves */}
          <FeatureCard feat={features[4]} className="lg:col-span-3" delay={0.4} />
          <FeatureCard feat={features[5]} className="lg:col-span-3" delay={0.5} />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════ How It Works illustrations ═══════════════════════════

function StepCard1() {
  return (
    <div className="w-36 h-28 rounded-2xl border border-border bg-card shadow-sm overflow-hidden shrink-0">
      <div className="h-5 bg-primary/[0.07] border-b border-border flex items-center px-2 gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/50" />
        <div className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
      </div>
      <div className="p-2.5 flex flex-col gap-1.5">
        {[['bg-blue-400/30', '80%'], ['bg-violet-400/30', '62%'], ['bg-teal-400/30', '72%']].map(([bg, w], i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded shrink-0 ${bg}`} />
            <div className="h-1.5 rounded bg-muted-foreground/[0.14] flex-1" style={{ maxWidth: w }} />
          </div>
        ))}
        <div className="mt-1.5 h-5 rounded-md bg-primary flex items-center justify-center gap-1.5 px-2">
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path d="M3.5 5.5V1.5M1.5 3.5l2-2 2 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="h-1 w-9 rounded bg-white/50" />
        </div>
      </div>
    </div>
  );
}

function StepCard2() {
  return (
    <div className="w-36 h-28 rounded-2xl border border-border bg-card shadow-sm overflow-hidden shrink-0">
      <div className="h-5 bg-primary/[0.07] border-b border-border flex items-center px-2 gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary/40" />
        <div className="h-1.5 w-14 rounded bg-muted-foreground/[0.14]" />
        <div className="ml-auto h-2 w-2 rounded-full bg-yellow-400/70" />
      </div>
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {['bg-blue-500/15', 'bg-violet-500/15', 'bg-cyan-500/15', 'bg-indigo-500/15'].map((bg, i) => (
          <div key={i} className={`rounded-lg ${bg} h-7 flex flex-col justify-center px-1.5 gap-1`}>
            <div className="h-1 rounded bg-foreground/[0.1] w-full" />
            <div className="h-1 rounded bg-foreground/[0.07] w-2/3" />
          </div>
        ))}
      </div>
      <div className="px-2.5 pb-2">
        <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
          <div className="h-full w-4/5 bg-primary rounded-full" />
        </div>
      </div>
    </div>
  );
}

function StepCard3() {
  return (
    <div className="w-36 h-28 rounded-2xl border border-border bg-card shadow-sm overflow-hidden shrink-0">
      <div className="h-5 bg-primary/[0.07] border-b border-border flex items-center justify-between px-2">
        <div className="h-1.5 w-8 rounded bg-muted-foreground/[0.14]" />
        <div className="h-1.5 w-6 rounded bg-primary/25" />
      </div>
      <div className="px-2.5 pt-2 pb-1 flex flex-col gap-1">
        <div className="h-1.5 rounded bg-muted-foreground/[0.14] w-full" />
        <div className="h-1.5 rounded bg-muted-foreground/[0.1] w-4/5" />
      </div>
      <div className="px-2 pb-2 flex flex-col gap-1">
        {[false, true, false].map((selected, i) => (
          <div key={i} className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 border ${selected ? 'bg-primary/12 border-primary/25' : 'bg-muted/15 border-transparent'}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${selected ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded ${selected ? 'bg-primary/30' : 'bg-muted-foreground/[0.14]'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard4() {
  return (
    <div className="w-36 h-28 rounded-2xl border border-border bg-card shadow-sm overflow-hidden shrink-0">
      <div className="h-5 bg-primary/[0.07] border-b border-border flex items-center px-2">
        <div className="h-1.5 w-14 rounded bg-muted-foreground/[0.14]" />
      </div>
      <div className="flex flex-col items-center justify-center py-3 gap-1.5">
        <span className="text-[20px] font-bold text-primary leading-none">95%</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} width="9" height="9" viewBox="0 0 10 10" className={s <= 4 ? 'text-yellow-400' : 'text-border/50'}>
              <polygon points="5,1 6.5,3.8 9.5,4.1 7.2,6.3 7.9,9.2 5,7.6 2.1,9.2 2.8,6.3 0.5,4.1 3.5,3.8" fill="currentColor"/>
            </svg>
          ))}
        </div>
      </div>
      <div className="px-2.5 pb-2">
        <div className="h-5 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center">
          <div className="h-1 w-14 rounded bg-primary/35" />
        </div>
      </div>
    </div>
  );
}

function HowItWorksArrow({ curveDown }: { curveDown: boolean }) {
  return (
    <div className="hidden lg:flex items-start justify-center shrink-0 w-14 pt-9">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d={curveDown ? 'M4 12 C18 12 38 44 52 44' : 'M4 44 C18 44 38 12 52 12'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          className="text-border"
        />
        {curveDown
          ? <path d="M46 39 L52 44 L46 49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40"/>
          : <path d="M46 7 L52 12 L46 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40"/>
        }
      </svg>
    </div>
  );
}


// ─── FAQ Item ────────────────────────────────────────────────────────────────
function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      className={`border rounded-xl overflow-hidden transition-colors duration-200 ${
        open ? 'border-primary/40 bg-primary/[0.03]' : 'border-border bg-transparent'
      }`}
      layout
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-hover transition-colors"
      >
        <span className={`text-sm font-semibold transition-colors duration-150 ${open ? 'text-primary' : 'text-foreground'}`}>
          {question}
        </span>
        <motion.svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="shrink-0 text-muted-foreground"
        >
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-5 pb-4 pt-3 text-sm text-muted-foreground leading-relaxed border-t border-border/60">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}

const faqItems = [
  {
    q: 'What file types can I upload?',
    a: 'You can upload PDFs, Word documents, PowerPoint slides, and plain text files. We support most common study material formats.',
  },
  {
    q: 'How does the quiz generator work?',
    a: 'Our AI reads your uploaded materials and automatically extracts key concepts to generate multiple-choice, true/false, and short-answer questions tailored to your content.',
  },
  {
    q: 'Is Lamla AI free to use?',
    a: 'Yes — you can get started for free with no credit card required. Free accounts include quiz generation, flashcards, and limited AI tutor sessions.',
  },
  {
    q: 'How accurate is the AI tutor?',
    a: 'The AI tutor is powered by advanced language models and grounded in your uploaded materials, so answers are relevant and contextual to your specific course content.',
  },
  {
    q: 'Can I use Lamla AI on mobile?',
    a: 'Absolutely. Lamla AI is fully responsive and works on phones and tablets, so you can study anywhere at any time.',
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-1">FAQ</p>
      <h3 className="text-2xl font-bold text-foreground mb-4">Frequently Asked Questions</h3>
      {faqItems.map(({ q, a }, i) => (
        <FaqItem
          key={i}
          question={q}
          answer={a}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}

// ─── About Section ───────────────────────────────────────────────────────────
function AboutSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section id="about" className="relative py-24 px-4 bg-background overflow-hidden">
      {/* bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--background))]" />
      <div className="max-w-6xl mx-auto" ref={ref}>
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Left — image */}
          <motion.div
            className="relative rounded-2xl overflow-hidden min-h-[420px] md:min-h-[480px]"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Image
              src="/highfive-with-teacher.jpg"
              alt="Students studying with Lamla AI"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay badge */}
            <div className="absolute bottom-5 left-5 px-4 py-2 rounded-full bg-background/70 backdrop-blur-md border border-border text-sm font-medium text-foreground">
              AI-Powered Study Tool
            </div>
          </motion.div>

          {/* Right — text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          >
            <p className="text-sm font-extrabold tracking-widest uppercase text-primary mb-4">
              About Lamla AI
            </p>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-[1.15] mb-6">
              Smarter Studying,{' '}
              <span className="text-primary">Better Results</span>
            </h3>
            <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed text-[0.97rem]">
              <p>
                Lamla AI was built for students who want to study with purpose. We combine
                cutting-edge AI with your own course materials to create a personalised study
                experience that actually works.
              </p>
              <p>
                Whether you&apos;re preparing for finals or just reviewing before a test —
                Lamla AI turns your slides and notes into quizzes, flashcards, and instant
                AI-powered explanations.
              </p>
              <p>
                Built by students, for students. Our platform evolves with your feedback so
                you can walk into every exam with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/quiz/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Start Studying →
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-surface text-foreground font-semibold text-sm hover:bg-surface-hover transition-colors"
              >
                Our Features
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Data ────────────────────────────────────────────────────────
const testimonials = [
  {
    initials: 'CN',
    name: 'Christopher N.',
    role: 'Student @ KNUST',
    quote:
      '"Lamla AI completely changed how I prepare for exams. I upload my lecture slides and instantly get practice quizzes. My grades improved significantly after just two weeks."',
  },
  {
    initials: 'AO',
    name: 'Ama Owusu',
    role: 'Medical Student, UG',
    quote:
      '"The AI tutor feature is incredible. It explains complex biochemistry concepts in ways my textbooks never could. I can ask follow-up questions and get instant, clear answers."',
  },
  {
    initials: 'KA',
    name: 'Kwame Asante',
    role: 'Engineering Student, KNUST',
    quote:
      '"Flashcards used to take me hours to create. Now I generate a full deck from my notes in seconds. The spaced repetition makes revision so much more effective."',
  },
  {
    initials: 'NB',
    name: 'Nana Boateng',
    role: 'Law Student, GIMPA',
    quote:
      '"I was skeptical at first, but Lamla AI genuinely understands my study materials. The quiz generator picks the most important concepts and turns them into exam-style questions."',
  },
  {
    initials: 'EY',
    name: 'Efua Yeboah',
    role: 'Business Student, Ashesi',
    quote:
      '"Using Lamla AI feels like having a personal tutor available 24/7. It keeps me focused and on track even during the most stressful exam periods."',
  },
  {
    initials: 'JM',
    name: 'Joseph Mensah',
    role: 'Computer Science, UCC',
    quote:
      '"The materials management feature alone is worth it. All my PDFs and notes are organised in one place, and I can generate quizzes from any of them instantly."',
  },
];

function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [animating, setAnimating] = useState(false);
  const total = testimonials.length;

  const go = (dir: number) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + dir + total) % total);
      setAnimating(false);
    }, 280);
  };

  const jumpTo = (i: number) => {
    if (animating || i === current) return;
    setDirection(i > current ? 1 : -1);
    setAnimating(true);
    setTimeout(() => { setCurrent(i); setAnimating(false); }, 280);
  };

  const t = testimonials[current];

  return (
    <section className="relative py-28 px-4 overflow-hidden">
      {/* top + bottom fades */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_top,transparent,var(--background))] z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--background))] z-20" />
      {/* Topographic SVG background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07] dark:opacity-[0.09]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="topo-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 100 Q25 60 50 100 Q75 140 100 100 Q125 60 150 100 Q175 140 200 100" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M0 80 Q25 40 50 80 Q75 120 100 80 Q125 40 150 80 Q175 120 200 80" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M0 120 Q25 80 50 120 Q75 160 100 120 Q125 80 150 120 Q175 160 200 120" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M0 60 Q25 20 50 60 Q75 100 100 60 Q125 20 150 60 Q175 100 200 60" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M0 140 Q25 100 50 140 Q75 180 100 140 Q125 100 150 140 Q175 180 200 140" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M0 40 Q30 10 60 40 Q90 70 120 40 Q150 10 180 40 Q195 55 200 40" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            <path d="M0 160 Q30 130 60 160 Q90 190 120 160 Q150 130 180 160 Q195 175 200 160" fill="none" stroke="currentColor" strokeWidth="0.8"/>
            <path d="M0 20 Q40 -10 80 20 Q120 50 160 20 Q180 5 200 20" fill="none" stroke="currentColor" strokeWidth="0.7"/>
            <path d="M0 180 Q40 150 80 180 Q120 210 160 180 Q180 165 200 180" fill="none" stroke="currentColor" strokeWidth="0.7"/>
            <path d="M10 0 Q40 30 70 10 Q100 -10 130 20 Q160 50 190 10 Q195 5 200 0" fill="none" stroke="currentColor" strokeWidth="0.6"/>
            <path d="M0 200 Q30 170 60 190 Q90 210 120 185 Q150 160 180 195 Q195 205 200 200" fill="none" stroke="currentColor" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo-pattern)" className="text-foreground" color="currentColor"/>
      </svg>

      {/* Ambient glow — adapts to theme via primary */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 65% 70% at 80% 50%, oklch(from var(--primary) l c h / 0.07), transparent 65%)',
            'radial-gradient(ellipse 45% 55% at 20% 50%, oklch(from var(--primary) l c h / 0.04), transparent 60%)',
          ].join(', '),
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">

        {/* Badge */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold tracking-widest uppercase mb-8">
          Testimonials
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center leading-[1.15] mb-3 max-w-2xl">
          Loved by students
          <br />
          <span className="text-muted-foreground">and learners worldwide.</span>
        </h2>
        <p className="text-muted-foreground text-base text-center mb-16 max-w-md">
          Real feedback from real students who use Lamla AI to study smarter and perform better every day.
        </p>

        {/* Card carousel */}
        <div className="relative w-full max-w-2xl flex items-center justify-center" style={{ minHeight: 280 }}>

          {/* Left arrow */}
          <button
            onClick={() => go(-1)}
            className="absolute -left-4 sm:-left-14 z-20 w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all duration-150"
            aria-label="Previous testimonial"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Stacked cards */}
          <div className="relative w-full">
            {/* Card 3 — furthest back */}
            <div
              className="absolute inset-x-6 rounded-2xl border border-border bg-card"
              style={{ top: 16, bottom: -16, transform: 'scale(0.94)', zIndex: 1, opacity: 0.5 }}
            />
            {/* Card 2 — middle */}
            <div
              className="absolute inset-x-3 rounded-2xl border border-border bg-card"
              style={{ top: 8, bottom: -8, transform: 'scale(0.97)', zIndex: 2, opacity: 0.7 }}
            />

            {/* Active card */}
            <motion.div
              key={current}
              initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10 rounded-2xl border border-border bg-card p-8 md:p-10 shadow-lg"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground text-lg md:text-xl leading-relaxed font-light mb-8 tracking-[-0.01em]">
                {t.quote}
              </p>

              {/* Divider */}
              <div className="h-px bg-border mb-6" />

              {/* Author */}
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => go(1)}
            className="absolute -right-4 sm:-right-14 z-20 w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all duration-150"
            aria-label="Next testimonial"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-1.5 bg-primary'
                  : 'w-1.5 h-1.5 bg-border hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>

        {/* Social proof */}
        <p className="text-muted-foreground text-sm mt-12 text-center">
          Join <span className="text-foreground font-medium">2,000+</span> students who study smarter with Lamla AI.
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [contactStatus, setContactStatus] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      title: formData.get('title'),
      message: formData.get('message'),
    };

    // Strip accidental surrounding quotes (e.g. Vercel dashboard sets `"https://..."`)
    const gasUrl = (process.env.NEXT_PUBLIC_GAS_CONTACT_URL || '')
      .replace(/^["']|["']$/g, '')
      .trim() || null;

    try {
      setIsSendingContact(true);

      if (gasUrl) {
        // Try GAS first. Use text/plain to avoid CORS preflight — GAS Web Apps
        // don't handle OPTIONS requests, but text/plain is a "simple" request
        // that goes through directly. The body is still JSON; GAS parses it fine.
        const res = await fetch(gasUrl, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'text/plain' },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'GAS error');
      } else {
        // GAS not configured — fall back to Django
        await djangoApi.post('/dashboard/contact/', payload);
      }

      setContactStatus('Thanks for reaching out. We will get back to you soon.');
      form.reset();
    } catch (err) {
      console.error('Contact form error:', err);
      // GAS failed — fall back to Django
      if (gasUrl) {
        try {
          await djangoApi.post('/dashboard/contact/', payload);
          setContactStatus('Thanks for reaching out. We will get back to you soon.');
          form.reset();
          return;
        } catch (djangoErr) {
          console.error('Django fallback error:', djangoErr);
        }
      }
      setContactStatus('We could not send your message right now. Please try again.');
    } finally {
      setIsSendingContact(false);
      setTimeout(() => setContactStatus(''), 3500);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <HeroSection />

      {/* ── About ────────────────────────────────────────── */}
      <AboutSection />

      {/* ── Stats ─────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_top,transparent,var(--background))] z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--background))] z-20" />
        {/* Animated background orbs */}
        <motion.div
          className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          animate={{ y: [0, -30, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none"
          animate={{ y: [0, 30, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
          animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <motion.p
              className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              By the numbers
            </motion.p>
            <motion.h2
              className="text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Trusted by <span className="gradient-text">Students</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-4 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Real results, real learners — see what lamla is delivering every week.
            </motion.p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <FeaturesGrid />

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden bg-background">
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_top,transparent,var(--background))] z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--background))] z-20" />

        {/* ── Background: large faint circuit / node grid ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Dot grid */}
            <pattern id="hiw-dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <circle cx="24" cy="24" r="1" fill="currentColor" className="text-border" opacity="1"/>
            </pattern>
            {/* Diagonal lines */}
            <pattern id="hiw-diag" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M0 48 L48 0" stroke="currentColor" strokeWidth="0.4" className="text-border" opacity="0.7"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hiw-dots)"/>
          <rect width="100%" height="100%" fill="url(#hiw-diag)"/>
        </svg>

        {/* ── Glowing orb — top-left ── */}
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.22 245 / 0.22) 0%, transparent 70%)' }}
        />
        {/* ── Glowing orb — bottom-right ── */}
        <div
          className="absolute -bottom-40 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(circle, oklch(0.78 0.16 195 / 0.18) 0%, transparent 70%)' }}
        />
        {/* ── Glowing orb — center ── */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[320px] rounded-full pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(ellipse, oklch(0.62 0.22 245 / 0.10) 0%, transparent 70%)' }}
        />

        {/* ── Animated floating particles ── */}
        {[
          { cx: '12%', cy: '20%', r: 2.5, dur: '7s', dy: -18 },
          { cx: '88%', cy: '15%', r: 1.8, dur: '9s', dy: -22 },
          { cx: '25%', cy: '75%', r: 2,   dur: '6s', dy: -14 },
          { cx: '70%', cy: '80%', r: 3,   dur: '11s', dy: -26 },
          { cx: '55%', cy: '10%', r: 1.5, dur: '8s', dy: -20 },
          { cx: '40%', cy: '90%', r: 2.2, dur: '10s', dy: -18 },
        ].map(({ cx, cy, r, dur, dy }, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/25 pointer-events-none"
            style={{ left: cx, top: cy, width: r * 2, height: r * 2 }}
            animate={{ y: [0, dy, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: parseFloat(dur), repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
          />
        ))}

        {/* ── Horizontal scan-line ── */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-primary/10 pointer-events-none"
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.p
              className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4 }}
            >
              How It Works
            </motion.p>
            <motion.h2
              className="text-4xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              From Notes to <span className="text-primary">A+ in 4 Steps</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-4 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Upload your materials and let AI do the heavy lifting — then study smarter and walk into every exam with confidence.
            </motion.p>
          </div>

          {/* Desktop: horizontal flow with alternating curved arrows */}
          <div className="hidden lg:flex items-start justify-center">
            {([
              { step: '01', title: 'Upload Materials',  desc: 'Upload your lecture slides, notes, or past papers.',               card: <StepCard1 /> },
              { step: '02', title: 'Generate Content',  desc: 'AI instantly creates quizzes, flashcards, and summaries.',         card: <StepCard2 /> },
              { step: '03', title: 'Study & Practice',  desc: 'Test yourself, track weak spots, and improve fast.',               card: <StepCard3 /> },
              { step: '04', title: 'Ace Your Exams',    desc: 'Walk into your exam with real confidence.',                        card: <StepCard4 /> },
            ] as const).map(({ step, title, desc, card }, i) => (
              <div key={step} className="flex items-start">
                {i > 0 && <HowItWorksArrow curveDown={i % 2 !== 0} />}
                <motion.div
                  className="flex flex-col items-center text-center w-40"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  {card}
                  <div className="mt-4 px-1">
                    <span className="text-[10px] font-bold text-primary/50 tracking-[0.18em] uppercase">{step}</span>
                    <h3 className="font-semibold text-foreground mt-1 text-sm leading-snug">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Mobile/tablet: 2-column grid */}
          <div className="lg:hidden grid grid-cols-2 gap-6">
            {([
              { step: '01', title: 'Upload Materials',  desc: 'Upload your lecture slides, notes, or past papers.',       card: <StepCard1 /> },
              { step: '02', title: 'Generate Content',  desc: 'AI instantly creates quizzes, flashcards, and summaries.', card: <StepCard2 /> },
              { step: '03', title: 'Study & Practice',  desc: 'Test yourself, track weak spots, and improve fast.',       card: <StepCard3 /> },
              { step: '04', title: 'Ace Your Exams',    desc: 'Walk into your exam with real confidence.',                card: <StepCard4 /> },
            ] as const).map(({ step, title, desc, card }) => (
              <motion.div
                key={step}
                className="flex flex-col items-center text-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
              >
                {card}
                <div>
                  <span className="text-[10px] font-bold text-primary/50 tracking-[0.18em] uppercase">{step}</span>
                  <h3 className="font-semibold text-foreground mt-1 text-sm leading-snug">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── Contact + FAQ ────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_top,transparent,var(--background))] z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none bg-[linear-gradient(to_bottom,transparent,var(--background))] z-20" />

        {/* ── Layer 0: soft radial gradient (same as HeroSection) ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              'radial-gradient(ellipse 90% 60% at 50% 0%, oklch(0.62 0.22 245 / 0.12), transparent 70%)',
              'radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.78 0.16 195 / 0.07), transparent 60%)',
            ].join(', '),
          }}
        />

        {/* ── Layer 1: floating contact / message icons ── */}
        <div className="absolute inset-0 z-0">
          <FloatingContactIcons />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* Section header */}
          <div className="mb-14 text-center">
            <motion.p
              className="text-sm font-semibold text-primary tracking-widest uppercase mb-2"
              initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4 }}
            >
              Support
            </motion.p>
            <motion.h2
              className="text-4xl font-bold text-foreground"
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.05 }}
            >
              Have a Question?
            </motion.h2>
            <motion.p
              className="text-muted-foreground mt-3 max-w-md mx-auto"
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            >
              Browse our FAQs or drop us a message — we&apos;re happy to help.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* ── Contact card ── */}
            <motion.div
              className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55 }}
            >
              {/* Top shimmer line */}
              <div className="absolute top-0 inset-x-0 h-px bg-primary/30" />
              {/* Hex accent behind card */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 pointer-events-none blur-2xl"
                style={{ background: 'radial-gradient(circle, oklch(0.62 0.22 245 / 0.10), transparent 70%)' }}
              />

              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-1">Get In Touch</p>
              <h3 className="text-xl font-bold text-foreground mb-1">Send Us A Message</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Tell us what you need and the Lamla team will respond as soon as possible.
              </p>

              <form onSubmit={handleContactSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input name="name" type="text" placeholder="Your name" required
                    className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                  />
                  <input name="email" type="email" placeholder="Your email" required
                    className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                  />
                </div>
                <input name="title" type="text" placeholder="Subject" required
                  className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                />
                <textarea name="message" rows={4} placeholder="Type your message..." required
                  className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none placeholder:text-muted-foreground"
                />
                <button type="submit" disabled={isSendingContact}
                  className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isSendingContact ? 'Sending…' : 'Send Message →'}
                </button>
                {contactStatus && (
                  <p className="text-sm text-muted-foreground">{contactStatus}</p>
                )}
              </form>
            </motion.div>

            {/* ── FAQ card ── */}
            <motion.div
              className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55, delay: 0.1 }}
            >
              <div className="absolute top-0 inset-x-0 h-px bg-primary/30" />
              <div className="absolute -top-10 -left-10 w-40 h-40 pointer-events-none blur-2xl"
                style={{ background: 'radial-gradient(circle, oklch(0.78 0.16 195 / 0.10), transparent 70%)' }}
              />
              <FaqAccordion />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl gradient-bg p-12 text-center">
            <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Studies?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students using Lamla AI to study smarter and score higher.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/auth/signup'}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-blue-600 font-bold hover:bg-white/90 transition-colors"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/quiz/create"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white/15 border border-white/30 text-white font-bold hover:bg-white/25 transition-colors backdrop-blur-sm"
                >
                  Go to Quiz
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
