'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone } from 'lucide-react';
import djangoApi from '@/services/api';

const Footer = () => {
  const [newsletterStatus, setNewsletterStatus] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      setIsSubscribing(true);
      await djangoApi.post('/dashboard/newsletter/', {
        email: formData.get('newsletter_email'),
      });
      setNewsletterStatus('Subscribed. You will receive updates soon.');
      form.reset();
    } catch {
      setNewsletterStatus('Subscription failed. Please try again.');
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setNewsletterStatus(''), 3500);
    }
  };

  return (
    <footer className="border-t border-border bg-background">

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Col 1 — Brand + Contact */}
        <div className="flex flex-col gap-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
              <Image src="/lamla_logo.png" alt="Lamla AI" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg text-foreground">Lamla.ai</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered study tools built by students, for students. Turn your notes into quizzes, flashcards, and instant AI tutoring.
          </p>
          <ul className="flex flex-col gap-2.5 mt-1">
            <li>
              <a
                href="mailto:lamlaaiteam@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Mail size={14} className="shrink-0 group-hover:text-primary transition-colors" />
                lamlaaiteam@gmail.com
              </a>
            </li>
            <li>
              <a
                href="tel:+233509341251"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Phone size={14} className="shrink-0 group-hover:text-primary transition-colors" />
                +233 50 934 1251
              </a>
            </li>
          </ul>
        </div>

        {/* Col 2 — Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-5 tracking-wide">Quick Links</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-1 gap-3">
            {[
              { label: 'Home',           href: '/' },
              { label: 'AI Tutor',       href: '/ai-tutor' },
              { label: 'Quiz',           href: '/quiz/create' },
              { label: 'Flashcards',     href: '/flashcards' },
              { label: 'Exam Analyser',  href: '/ai-tutor' },
              { label: 'Dashboard',      href: '/dashboard' },
              { label: 'Materials',      href: '/materials' },
              { label: 'About Us',       href: '/about' },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-150 inline-block"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3 — Newsletter */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground mb-2 tracking-wide">Newsletter</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Get product updates, study tips, and feature announcements.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2 mt-1">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface p-1">
              <input
                type="email"
                name="newsletter_email"
                placeholder="Enter your email"
                required
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-2 py-1.5 focus:outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0 whitespace-nowrap"
              >
                {isSubscribing ? 'Subscribing…' : 'Subscribe'}
              </button>
            </div>
            {newsletterStatus && (
              <p className="text-xs text-primary font-medium">{newsletterStatus}</p>
            )}
          </form>
        </div>

        {/* Col 4 — Social */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-5 tracking-wide">Connect With Us</h3>
          <div className="flex gap-3 flex-wrap">
            {[
              {
                label: 'Instagram',
                href: 'https://www.instagram.com/lamla.io',
                icon: 'https://staticassets.netlify.app/public/icons/social/instagram.png',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/company/lamla-ai',
                icon: 'https://staticassets.netlify.app/public/icons/social/linkedin.png',
              },
              {
                label: 'Facebook',
                href: 'https://www.facebook.com/people/LamlaAI/61578006032583/',
                icon: 'https://staticassets.netlify.app/public/icons/social/facebook.png',
              },
              {
                label: 'X / Twitter',
                href: 'https://x.com/lamla.ai',
                icon: 'https://staticassets.netlify.app/public/icons/social/twitter.png',
              },
            ].map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center hover:border-primary hover:scale-110 transition-all duration-150"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icon} alt={label} className="w-5 h-5 object-contain rounded-full" />
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* ── Footer bottom bar ── */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lamla AI. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: 'Privacy Policy',   href: '/privacy-policy' },
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Cookie Policy',    href: '/cookie-policy' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
