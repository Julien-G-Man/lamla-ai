'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Sparkles, Brain, Bot, Layers, Target, Users, Zap, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    desc: 'Our intelligent systems adapt to how you study, generating personalised quizzes and explanations from your own materials.',
  },
  {
    icon: Target,
    title: 'Exam-Focused',
    desc: 'Every feature is designed with one goal in mind — helping you perform better in exams, not just learn passively.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Turn your notes into practice questions in seconds. No waiting, no manual work — just smarter studying.',
  },
  {
    icon: Users,
    title: 'Built for Students',
    desc: 'We built Lamla.ai as students ourselves. We know what works and what wastes time.',
  },
];

const features = [
  { icon: Brain, label: 'AI Quiz Generator', desc: 'Turn notes into practice questions instantly' },
  { icon: Bot, label: 'Personal AI Tutor', desc: 'Get answers and explanations 24/7' },
  { icon: Layers, label: 'Smart Flashcards', desc: 'Build and review decks in minutes' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-24 sm:py-32 text-center">
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
              <Sparkles size={14} />
              Our Mission
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Study smarter with{' '}
              <span className="gradient-text">AI on your side</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Lamla.ai was built to close the gap between hard work and exam success.
              We believe every student deserves access to tools that actually help them learn —
              not just consume content.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="px-4 py-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shrink-0 glow-blue-sm">
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features highlight */}
        <section className="px-4 py-16 bg-surface/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Everything you need to ace exams</h2>
            <p className="text-muted-foreground mb-10">
              Three powerful tools, one seamless experience.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="glass rounded-xl p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center glow-blue">
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="px-4 py-16 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Built by students, for students</h2>
          <p className="text-muted-foreground leading-relaxed">
            We started Lamla.ai because we were frustrated with passive studying tools that
            didn&apos;t actually improve our exam scores. So we built our own — powered by the
            latest AI, designed for real exam prep, and constantly improved based on feedback
            from students like you.
          </p>
        </section>

        {/* CTA */}
        <section className="px-4 py-20">
          <div className="max-w-2xl mx-auto glass rounded-2xl p-10 text-center flex flex-col items-center gap-6 border border-primary/20">
            <div className="w-14 h-14 rounded-xl overflow-hidden glow-blue">
              <Image src="/lamla_logo.png" alt="Lamla AI" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ready to study smarter?</h2>
              <p className="text-muted-foreground mt-2">
                Join thousands of students already using Lamla.ai to prepare for their exams.
              </p>
            </div>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-bg text-white font-semibold hover:opacity-90 transition-opacity glow-blue-sm"
            >
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
