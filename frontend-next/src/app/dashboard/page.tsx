'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import { dashboardService } from '@/services/dashboard';
import { materialsService } from '@/services/materials';
import {
  BookOpen, Trophy, Calendar, Layers, Bot, Upload,
  ArrowRight, Brain, Sparkles, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalQuizzes: number;
  averageScore: number;
  studyStreak: number;
  totalFlashcards: number;
}

interface ActivityItem {
  id: string;
  type: 'quiz' | 'flashcard' | 'material';
  title: string;
  subtitle: string;
  score?: number;
  created_at: string;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, getUserRole } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Stats>({ totalQuizzes: 0, averageScore: 0, studyStreak: 0, totalFlashcards: 0 });
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() === 'admin') router.push('/admin-dashboard');
  }, [isLoading, isAuthenticated, router, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingStats(true);
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getQuizHistory(),
      dashboardService.getFlashcardHistory().catch(() => []),
      materialsService.getMine(),
    ])
      .then(([statsData, quizzes, flashcardDecks, materials]) => {
        setStats({
          totalQuizzes: statsData.total_quizzes,
          averageScore: statsData.average_score,
          studyStreak: statsData.study_streak,
          totalFlashcards: statsData.total_flashcard_sets,
        });
        setQuizHistory(quizzes || []);
        const quizActivity = (quizzes || []).map((q: any) => ({
          id: `quiz-${q.id}`, type: 'quiz' as const, title: q.subject || 'Quiz',
          subtitle: `Score: ${q.score_percent}%`, score: q.score_percent, created_at: q.created_at,
        }));
        const deckActivity = (flashcardDecks || []).map((d: any) => ({
          id: `deck-${d.id}`, type: 'flashcard' as const,
          title: d.title || d.subject || 'Flashcard Deck',
          subtitle: `${d.card_count ?? d.flashcard_count ?? ''} cards`.trim(), created_at: d.created_at,
        }));
        const materialActivity = (materials || []).map((m: any) => ({
          id: `material-${m.id}`, type: 'material' as const, title: m.title,
          subtitle: `${m.file_size_display} · ${m.download_count} downloads`, created_at: m.created_at,
        }));
        const merged = [...quizActivity, ...deckActivity, ...materialActivity].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentActivity(merged);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [isAuthenticated]);

  const handleLogout = async () => { await logout(); router.push('/'); };

  const statCards = [
    {
      icon: BookOpen, label: 'Total Quizzes', value: stats.totalQuizzes,
      color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400',
    },
    {
      icon: Trophy, label: 'Avg Score', value: `${stats.averageScore}%`,
      color: 'from-yellow-500/20 to-yellow-600/5', iconColor: 'text-yellow-400',
    },
    {
      icon: Calendar, label: 'Study Streak', value: `${stats.studyStreak}d`,
      color: 'from-green-500/20 to-green-600/5', iconColor: 'text-green-400',
    },
    {
      icon: Layers, label: 'Flashcard Sets', value: stats.totalFlashcards,
      color: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-400',
    },
  ];

  const quickActions = [
    {
      icon: Brain, title: 'Create Quiz', desc: 'Generate questions from your notes',
      path: '/quiz/create', color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Layers, title: 'New Flashcards', desc: 'Build smart flashcard decks',
      path: '/flashcards/create', color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Bot, title: 'AI Tutor', desc: 'Get instant personalised help',
      path: '/ai-tutor', color: 'from-cyan-500 to-teal-500',
    },
    {
      icon: Upload, title: 'Upload Material', desc: 'Share your study files',
      path: '/materials/upload', color: 'from-indigo-500 to-blue-500',
    },
  ];

  const activityIcon = (type: ActivityItem['type']) => {
    if (type === 'quiz') return <Brain size={14} />;
    if (type === 'material') return <Upload size={14} />;
    return <Layers size={14} />;
  };

  const activityColor = (type: ActivityItem['type']) => {
    if (type === 'quiz') return 'bg-blue-500/20 text-blue-400';
    if (type === 'material') return 'bg-indigo-500/20 text-indigo-400';
    return 'bg-violet-500/20 text-violet-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles size={18} className="animate-pulse text-primary" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Quiz History' },
    { id: 'uploads', label: 'Materials' },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-border pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Welcome banner */}
            <div className="relative overflow-hidden glass rounded-2xl p-6">
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                <Sparkles size={80} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{getGreeting()},</p>
              <h1 className="text-2xl font-bold">
                <span className="gradient-text">{user?.username}</span> 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {loadingStats
                  ? 'Loading your stats...'
                  : `You've completed ${stats.totalQuizzes} quizzes with an average score of ${stats.averageScore}%.`}
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(({ icon: Icon, label, value, color, iconColor }) => (
                <div key={label} className="glass rounded-xl p-4 card-hover flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${color} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <h3 className="text-xl font-bold">{loadingStats ? '—' : value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Quick Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map(({ icon: Icon, title, desc, path, color }) => (
                  <Link
                    key={title}
                    href={path}
                    className="group glass rounded-xl p-4 card-hover flex flex-col items-center text-center gap-2"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${color} flex items-center justify-center group-hover:glow-blue-sm transition-all`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <h3 className="font-medium text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass rounded-xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary" /> Recent Activity
              </h2>
              {loadingStats ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Loading activity...</p>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center gap-3">
                  <p className="text-muted-foreground text-sm">No activity yet. Create a quiz to get started!</p>
                  <Link
                    href="/quiz/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Quiz <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {recentActivity.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activityColor(item.type)}`}>
                        {activityIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {item.type === 'quiz' ? 'Quiz' : item.type === 'material' ? 'Material' : 'Flashcards'}
                          {item.subtitle ? ` · ${item.subtitle}` : ''}
                          {' · '}
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.type === 'quiz' && item.score != null && (
                        <span className={`text-sm font-bold shrink-0 ${item.score >= 70 ? 'text-green-400' : item.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {item.score}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz History Tab */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold">Quiz History</h1>
              <p className="text-muted-foreground text-sm mt-1">Review your past performance.</p>
            </div>
            <div className="glass rounded-xl overflow-hidden">
              {quizHistory.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-3">
                  <Brain size={40} className="text-muted-foreground/40" />
                  <p className="text-muted-foreground">No quiz history yet.</p>
                  <Link
                    href="/quiz/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Take a Quiz <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {quizHistory.map((q: any) => (
                    <div key={q.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <h3 className="font-medium text-sm">{q.subject}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {q.total_questions} questions · {new Date(q.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-lg font-bold ${q.score_percent >= 70 ? 'text-green-400' : q.score_percent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {q.score_percent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'uploads' && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold">My Materials</h1>
              <p className="text-muted-foreground text-sm mt-1">Upload study files to share with everyone.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/materials/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Upload size={14} /> Upload Material
              </Link>
              <Link
                href="/materials"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-hover transition-colors"
              >
                Browse All
              </Link>
            </div>
            <div className="glass rounded-xl p-12 text-center flex flex-col items-center gap-3">
              <Upload size={40} className="text-muted-foreground/40" />
              <p className="text-muted-foreground">No materials uploaded yet. Share a PDF with the community.</p>
              <Link
                href="/materials/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition-opacity mt-2"
              >
                Upload Now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
