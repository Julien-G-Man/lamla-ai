'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
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
    color: 'from-blue-500/20 to-blue-600/5',
    iconColor: 'text-blue-400',
  },
  {
    href: '/ai-tutor',
    icon: Bot,
    title: 'AI Tutor',
    desc: 'Get instant answers, deeper explanations, and concept breakdowns from your personal AI.',
    color: 'from-cyan-500/20 to-cyan-600/5',
    iconColor: 'text-cyan-400',
  },
  {
    href: '/flashcards',
    icon: Layers,
    title: 'Flashcards',
    desc: 'Create and study AI-generated flashcard decks for rapid-fire review and retention.',
    color: 'from-violet-500/20 to-violet-600/5',
    iconColor: 'text-violet-400',
  },
  {
    href: '/ai-tutor',
    icon: Microscope,
    title: 'Exam Analysis',
    desc: 'Upload past exams or slides for instant topic breakdowns and targeted feedback.',
    color: 'from-indigo-500/20 to-indigo-600/5',
    iconColor: 'text-indigo-400',
  },
  {
    href: '/dashboard',
    icon: BarChart3,
    title: 'Performance Analytics',
    desc: 'Track your progress over time and pinpoint exactly where to focus your efforts.',
    color: 'from-sky-500/20 to-sky-600/5',
    iconColor: 'text-sky-400',
  },
  {
    href: '/materials',
    icon: FolderOpen,
    title: 'Study Materials',
    desc: "Browse community-uploaded materials or upload your own slides and notes.",
    color: 'from-teal-500/20 to-teal-600/5',
    iconColor: 'text-teal-400',
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
    bar: 'from-blue-500 to-cyan-400',
  },
  {
    value: 250,
    suffix: '+',
    label: 'Quizzes Generated',
    hint: 'AI-created sets across subjects',
    icon: Layers,
    progress: '78%',
    bar: 'from-indigo-500 to-blue-400',
  },
  {
    value: 92,
    suffix: '%',
    label: 'Average Success Rate',
    hint: 'Students reporting better scores',
    icon: Target,
    progress: '92%',
    bar: 'from-emerald-500 to-teal-400',
  },
  {
    value: 3,
    suffix: '+',
    label: 'AI Study Modes',
    hint: 'Tutor, Quizzes, and Flashcards',
    icon: Sparkles,
    progress: '55%',
    bar: 'from-violet-500 to-fuchsia-400',
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

const steps = [
  { icon: FolderOpen, step: '01', title: 'Upload Materials', desc: 'Upload your lecture slides, notes, or past papers.' },
  { icon: Zap, step: '02', title: 'Generate Content', desc: 'AI instantly creates quizzes, flashcards, and summaries.' },
  { icon: Target, step: '03', title: 'Study & Practice', desc: 'Test yourself, track weak spots, and improve fast.' },
  { icon: BookOpen, step: '04', title: 'Ace Your Exams', desc: 'Walk into your exam with real confidence.' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [contactStatus, setContactStatus] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = statsSectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStatsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

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
    try {
      setIsSendingContact(true);
      await djangoApi.post('/dashboard/contact/', payload);
      setContactStatus('Thanks for reaching out. We will get back to you soon.');
      form.reset();
    } catch {
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

      {/* ── Stats Band ───────────────────────────────────── */}
      <section ref={statsSectionRef} className="relative z-20 -mt-16 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface/85 shadow-[0_30px_80px_-45px_oklch(0.62_0.22_245/0.65)] backdrop-blur-md">
            <div className="absolute inset-0 bg-grid opacity-25 pointer-events-none" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[80%] rounded-full bg-linear-to-r from-blue-500/20 via-cyan-400/15 to-violet-500/20 blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-border/60">
              {stats.map(({ value, suffix, label, hint, icon: Icon, progress, bar }) => (
                <div key={label} className="p-6 md:p-7 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg glass">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Live
                    </span>
                  </div>

                  <div>
                    <p className="text-3xl md:text-4xl font-bold tracking-tight gradient-text-strong">
                      <AnimatedStatNumber value={value} suffix={suffix} start={statsVisible} />
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${bar}`}
                      style={{ width: progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase">Features</p>
            <h2 className="text-4xl font-bold tracking-tight">
              Smart Tools for{' '}
              <span className="gradient-text">Smart Students</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Everything you need to study more effectively, all powered by the latest AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ href, icon: Icon, title, desc, color, iconColor }) => (
              <Link
                key={title}
                href={href}
                className="group glass rounded-xl p-6 card-hover"
              >
                <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${color} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <span className="inline-flex items-center gap-1 text-primary text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase">How It Works</p>
            <h2 className="text-4xl font-bold tracking-tight">
              From Notes to{' '}
              <span className="gradient-text">A+ in 4 Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, step, title, desc }, i) => (
              <div key={step} className="relative flex flex-col gap-4">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-1rem)] w-8 h-px border-t border-dashed border-border z-10" />
                )}
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center glow-blue-sm">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary/60 tracking-widest">{step}</span>
                  <h3 className="font-semibold text-foreground mt-0.5">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ──────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase">Testimonials</p>
            <h2 className="text-4xl font-bold tracking-tight">
              What Students{' '}
              <span className="gradient-text">Are Saying</span>
            </h2>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <blockquote className="text-foreground text-lg leading-relaxed mb-6">
                &ldquo;Lamla AI helped me turn my lecture slides into practice quizzes in seconds.
                It&apos;s an amazing tool for exam prep!&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-sm text-white">
                  CN
                </div>
                <div>
                  <p className="font-semibold text-sm">Christopher N</p>
                  <p className="text-xs text-muted-foreground">Student @ KNUST</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border">
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
              <Link
                href={isAuthenticated ? '/dashboard' : '/auth/signup'}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-blue-600 font-bold hover:bg-white/90 transition-colors"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm font-semibold text-primary mb-3 tracking-widest uppercase">Get In Touch</p>
              <h3 className="text-3xl font-bold mb-4">Have Questions?<br />Send Us A Message</h3>
              <p className="text-muted-foreground mb-8">
                Tell us what you need and the Lamla team will respond as soon as possible.
              </p>
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="name" type="text" placeholder="Your name" required
                    className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                  />
                  <input
                    name="email" type="email" placeholder="Your email" required
                    className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                  />
                </div>
                <input
                  name="title" type="text" placeholder="Subject" required
                  className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow placeholder:text-muted-foreground"
                />
                <textarea
                  name="message" rows={4} placeholder="Type your message..." required
                  className="px-4 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit" disabled={isSendingContact}
                  className="px-6 py-2.5 rounded-lg gradient-bg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isSendingContact ? 'Sending...' : 'Send Message'}
                </button>
                {contactStatus && (
                  <p className="text-sm text-muted-foreground">{contactStatus}</p>
                )}
              </form>
            </div>

            <div className="flex flex-col gap-6 md:pt-16">
              {features.slice(0, 3).map(({ icon: Icon, title, iconColor, color }) => (
                <div key={title} className="flex items-start gap-4 glass rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${color} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Powered by advanced AI models</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
