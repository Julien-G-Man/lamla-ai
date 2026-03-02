import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faHistory, faCloudUploadAlt, faLock, faUser,
  faRightFromBracket, faBook, faTrophy, faCalendar,
  faLayerGroup, faChevronRight, faRobot,
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';
import { dashboardService } from "../../services/dashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, getUserRole } = useAuth();
  const [activeTab, setActiveTab]   = useState('overview');
  const [stats, setStats]           = useState({
    totalQuizzes: 0, averageScore: 0, studyStreak: 0, totalFlashcards: 0,
  });
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate('/auth/login'); return; }
    if (!isLoading && isAuthenticated && getUserRole() === 'admin') navigate('/admin-dashboard');
  }, [isLoading, isAuthenticated, navigate, getUserRole]);

  // Fetch data
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

  const handleLogout = async () => { await logout(); navigate('/'); };

  const navItems = [
    { id: 'overview', icon: faHome,          label: 'Dashboard'   },
    { id: 'history',  icon: faHistory,        label: 'Past Quizzes' },
    { id: 'uploads',  icon: faCloudUploadAlt, label: 'Materials'   },
    { id: 'profile',  icon: faUser,           label: 'Profile'     },
    { id: 'security', icon: faLock,           label: 'Security'    },
  ];

  const statCards = [
    { icon: faBook,       label: 'Total Quizzes',  value: stats.totalQuizzes },
    { icon: faTrophy,     label: 'Average Score',  value: `${stats.averageScore}%` },
    { icon: faCalendar,   label: 'Study Streak',   value: `${stats.studyStreak}d` },
    { icon: faLayerGroup, label: 'Flashcard Sets', value: stats.totalFlashcards },
  ];

  const quickActions = [
    { icon: faBook,       title: 'Create Quiz',  desc: 'Generate a quiz from your notes', path: '/custom-quiz' },
    { icon: faLayerGroup, title: 'Flashcards',   desc: 'Create smart flashcard sets',     path: '/flashcards'  },
    { icon: faRobot,      title: 'AI Tutor',     desc: 'Get instant personalised help',   path: '/ai-tutor'    },
  ];

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-wrapper">

        {/* ── Sidebar ── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-user">
            <div className="db-avatar">
              {user?.profile_image
                ? <img src={user.profile_image} alt="avatar" />
                : user?.username?.[0]?.toUpperCase()}
            </div>
            <h3>{user?.username}</h3>
            <p>{user?.email}</p>
            <span className="db-role-badge">Student</span>
          </div>

          <nav className="db-nav">
            {navItems.map(({ id, icon, label }) => (
              <button
                key={id}
                className={`db-nav-item ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <FontAwesomeIcon icon={icon} /> {label}
              </button>
            ))}
          </nav>

          <button className="db-logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} /> Logout
          </button>
        </aside>

        {/* ── Main ── */}
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
                    <button className="db-btn db-btn-primary" onClick={() => navigate('/custom-quiz')}>
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
                          <span>{q.difficulty} · {new Date(q.created_at).toLocaleDateString()}</span>
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
                    <button className="db-btn db-btn-primary" onClick={() => navigate('/custom-quiz')}>
                      Take a Quiz
                    </button>
                  </div>
                ) : (
                  quizHistory.map((q) => (
                    <div className="db-quiz-row" key={q.id}>
                      <div className="db-quiz-info">
                        <h3>{q.subject}</h3>
                        <p>{q.total} questions · {q.difficulty} · {new Date(q.created_at).toLocaleDateString()}</p>
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

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Profile</h1>
                <p>Manage your account information.</p>
              </div>
              <div className="db-card" style={{ textAlign: 'center', paddingTop: 36 }}>
                <div className="db-profile-avatar-lg">
                  {user?.profile_image
                    ? <img src={user.profile_image} alt="avatar" />
                    : user?.username?.[0]?.toUpperCase()}
                </div>
                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: '1.15rem' }}>
                  {user?.username}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.88rem' }}>
                  {user?.email}
                </p>
                <button className="db-btn db-btn-primary" onClick={() => navigate('/profile')}>
                  Open Full Profile <FontAwesomeIcon icon={faChevronRight} />
                </button>
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
                <h2>Change Password</h2>
                <form className="db-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="db-field">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="db-form-row">
                    <div className="db-field">
                      <label>New Password</label>
                      <input type="password" placeholder="••••••••" />
                    </div>
                    <div className="db-field">
                      <label>Confirm Password</label>
                      <input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <div>
                    <button type="submit" className="db-btn db-btn-primary">Update Password</button>
                  </div>
                </form>
              </div>

              <div className="db-card danger">
                <h2>Danger Zone</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
                  Permanently delete your account and all data. This cannot be undone.
                </p>
                <button className="db-btn db-btn-danger">Delete My Account</button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;