import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faHistory, faCloudUploadAlt, faLock, faUser,
  faBook, faTrophy, faCalendar, faLayerGroup, faChevronRight, faRobot,
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';
import { dashboardService } from '../../services/dashboard';

const NAV_ITEMS = [
  { id: 'overview', icon: faHome,          label: 'Dashboard'    },
  { id: 'history',  icon: faHistory,        label: 'Past Quizzes' },
  { id: 'uploads',  icon: faCloudUploadAlt, label: 'Materials'    },
  { id: 'profile',  icon: faUser,           label: 'Profile'      },
  { id: 'security', icon: faLock,           label: 'Security'     },
];

const Dashboard = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, isAuthenticated, isLoading, logout, getUserRole } = useAuth();

  // Restore tab when navigating back from Profile
  const [activeTab, setActiveTab]     = useState(location.state?.tab || 'overview');
  const [stats, setStats]             = useState({ totalQuizzes: 0, averageScore: 0, studyStreak: 0, totalFlashcards: 0 });
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

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
    ])
      .then(([statsData, history]) => {
        setStats({
          totalQuizzes:    statsData.total_quizzes,
          averageScore:    statsData.average_score,
          studyStreak:     statsData.study_streak,
          totalFlashcards: statsData.total_flashcard_sets,
        });
        setQuizHistory(history);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [isAuthenticated]);

  const handleLogout  = async () => { await logout(); navigate('/'); };

  // 'profile' nav item goes to /profile page; others switch tab
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

              <div className="db-card">
                <div className="db-card-header"><h2>Recent Quizzes</h2></div>
                {quizHistory.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-icon">📋</div>
                    <p>No quizzes yet. Create one to get started!</p>
                    <button className="db-btn db-btn-primary" onClick={() => navigate('/quiz/create')}>
                      Create Quiz
                    </button>
                  </div>
                ) : (
                  <div className="db-activity-list">
                    {quizHistory.slice(0, 3).map((q) => (
                      <div className="db-activity-item" key={q.id}>
                        <div className="db-activity-dot"><FontAwesomeIcon icon={faBook} /></div>
                        <div className="db-activity-body">
                          <p>{q.subject}</p>
                          <span>{new Date(q.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="db-activity-score">{q.score_percent}%</span>
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
                <p>Study files you've uploaded.</p>
              </div>
              <div style={{ marginBottom: 18 }}>
                <button className="db-btn db-btn-primary" onClick={() => navigate('/flashcards')}>
                  <FontAwesomeIcon icon={faCloudUploadAlt} /> Upload Material
                </button>
              </div>
              <div className="db-card">
                <div className="db-empty">
                  <div className="db-empty-icon">📁</div>
                  <p>No materials uploaded yet.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Security</h1>
                <p>Manage your password and account safety.</p>
              </div>
              <div className="db-card">
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Manage your password and account details on your profile page.
                </p>
                <button className="db-btn db-btn-primary" onClick={() => navigate('/profile')}>
                  Go to Profile <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;