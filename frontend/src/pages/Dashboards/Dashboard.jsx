import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faHistory, faCloudUploadAlt, faUser,
  faBook, faTrophy, faCalendar, faLayerGroup, faRobot,
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';
import { dashboardService } from '../../services/dashboard';

const NAV_ITEMS = [
  { id: 'overview', icon: faHome,          label: 'Dashboard'    },
  { id: 'history',  icon: faHistory,        label: 'Past Quizzes' },
  { id: 'uploads',  icon: faCloudUploadAlt, label: 'Materials'    },
  { id: 'profile',  icon: faUser,           label: 'Profile'      },
];

const Dashboard = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, isAuthenticated, isLoading, logout, getUserRole } = useAuth();

  const [activeTab, setActiveTab]         = useState(location.state?.tab || 'overview');
  const [stats, setStats]                 = useState({ totalQuizzes: 0, averageScore: 0, studyStreak: 0, totalFlashcards: 0 });
  const [quizHistory, setQuizHistory]     = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingStats, setLoadingStats]   = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() === 'admin') navigate('/admin-dashboard');
  }, [isLoading, isAuthenticated, navigate, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingStats(true);

    Promise.all([
      dashboardService.getStats(),
      dashboardService.getQuizHistory(),
      dashboardService.getFlashcardHistory().catch(() => []),
    ])
      .then(([statsData, quizzes, flashcardDecks]) => {
        setStats({
          totalQuizzes:    statsData.total_quizzes,
          averageScore:    statsData.average_score,
          studyStreak:     statsData.study_streak,
          totalFlashcards: statsData.total_flashcard_sets,
        });
        setQuizHistory(quizzes || []);

        // Merge quizzes + flashcard decks into a single activity feed
        const quizActivity = (quizzes || []).map(q => ({
          id:         `quiz-${q.id}`,
          type:       'quiz',
          title:      q.subject || 'Quiz',
          subtitle:   `Score: ${q.score_percent}%`,
          score:      q.score_percent,
          created_at: q.created_at,
        }));

        const deckActivity = (flashcardDecks || []).map(d => ({
          id:         `deck-${d.id}`,
          type:       'flashcard',
          title:      d.title || d.subject || 'Flashcard Deck',
          subtitle:   `${d.card_count ?? d.flashcard_count ?? ''} cards`.trim(),
          created_at: d.created_at,
        }));

        const merged = [...quizActivity, ...deckActivity].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setRecentActivity(merged);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [isAuthenticated]);

  const handleLogout   = async () => { await logout(); navigate('/'); };
  const handleNavigate = (id) => {
    if (id === 'profile') { navigate('/profile'); return; }
    setActiveTab(id);
  };

  const statCards = [
    { icon: faBook,       label: 'Total Quizzes',  value: stats.totalQuizzes },
    { icon: faTrophy,     label: 'Average Score',  value: `${stats.averageScore}%` },
    { icon: faCalendar,   label: 'Study Streak',   value: `${stats.studyStreak}d` },
    { icon: faLayerGroup, label: 'Flashcard Sets', value: stats.totalFlashcards },
  ];

  const quickActions = [
    { icon: faBook,       title: 'Create Quiz',  desc: 'Generate a quiz from your notes', path: '/quiz/create' },
    { icon: faLayerGroup, title: 'Flashcards',   desc: 'Create smart flashcard sets',     path: '/flashcards'  },
    { icon: faRobot,      title: 'AI Tutor',     desc: 'Get instant personalised help',   path: '/ai-tutor'    },
  ];

  const activityIcon = (type) => type === 'quiz' ? faBook : faLayerGroup;
  const activityLabel = (type) => type === 'quiz' ? 'Quiz' : 'Flashcards';

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-wrapper">

        <Sidebar
          user={user}
          navItems={NAV_ITEMS}
          activeId={activeTab}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          variant="user"
        />

        <main className="db-main">

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Welcome back, {user?.username} 👋</h1>
                <p>Here's your study summary.</p>
              </div>

              <div className="db-stats-grid">
                {statCards.map(({ icon, label, value }) => (
                  <div className="db-stat-card" key={label}>
                    <div className="db-stat-icon"><FontAwesomeIcon icon={icon} /></div>
                    <div className="db-stat-body">
                      <p>{label}</p>
                      <h3>{loadingStats ? '—' : value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="db-card" style={{ marginBottom: 22 }}>
                <div className="db-card-header"><h2>Quick Actions</h2></div>
                <div className="db-actions-grid">
                  {quickActions.map(({ icon, title, desc, path }) => (
                    <button className="db-action-card" key={title} onClick={() => navigate(path)}>
                      <div className="db-action-icon"><FontAwesomeIcon icon={icon} /></div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Recent Activity (quizzes + flashcards merged) ── */}
              <div className="db-card">
                <div className="db-card-header"><h2>Recent Activity</h2></div>
                {loadingStats ? (
                  <div className="db-empty"><p>Loading activity…</p></div>
                ) : recentActivity.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-icon">📋</div>
                    <p>No activity yet. Create a quiz or flashcard deck to get started!</p>
                    <button className="db-btn db-btn-primary" onClick={() => navigate('/quiz/create')}>
                      Create Quiz
                    </button>
                  </div>
                ) : (
                  <div className="db-activity-list">
                    {recentActivity.slice(0, 6).map((item) => (
                      <div className="db-activity-item" key={item.id}>
                        <div className="db-activity-dot">
                          <FontAwesomeIcon icon={activityIcon(item.type)} />
                        </div>
                        <div className="db-activity-body">
                          <p>{item.title}</p>
                          <span>
                            {activityLabel(item.type)}
                            {item.subtitle ? ` · ${item.subtitle}` : ''}
                            {' · '}
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {item.type === 'quiz' && item.score != null && (
                          <span className="db-activity-score">{item.score}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── History ── */}
          {activeTab === 'history' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Past Quizzes</h1>
                <p>Review your performance history.</p>
              </div>
              <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
                {quizHistory.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-icon">📋</div>
                    <p>No quiz history yet.</p>
                    <button className="db-btn db-btn-primary" onClick={() => navigate('/quiz/create')}>
                      Take a Quiz
                    </button>
                  </div>
                ) : (
                  quizHistory.map((q) => (
                    <div className="db-quiz-row" key={q.id}>
                      <div className="db-quiz-info">
                        <h3>{q.subject}</h3>
                        <p>{q.total_questions} questions · {new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="db-quiz-score">{q.score_percent}%</div>
                      <button className="db-btn db-btn-ghost db-btn-sm">Review</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Materials ── */}
          {activeTab === 'uploads' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>My Materials</h1>
                <p>Upload study files to share with everyone.</p>
              </div>
              <div style={{ marginBottom: 18 }}>
                <button className="db-btn db-btn-primary" onClick={() => navigate('/materials/upload')}>
                  <FontAwesomeIcon icon={faCloudUploadAlt} /> Upload Material
                </button>
                <button className="db-btn db-btn-ghost" style={{ marginLeft: 10 }} onClick={() => navigate('/materials')}>
                  Browse All Materials
                </button>
              </div>
              <div className="db-card">
                <div className="db-empty">
                  <div className="db-empty-icon">📁</div>
                  <p>No materials uploaded yet. Upload a PDF to share with the community.</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;