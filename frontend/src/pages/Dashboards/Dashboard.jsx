import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faCloudUploadAlt, faUser,
  faBook, faTrophy, faCalendar, faLayerGroup, faRobot,
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';
import { dashboardService } from '../../services/dashboard';
import { materialsService } from '../../services/materials';

const NAV_ITEMS = [
  { id: 'overview', icon: faHome,          label: 'Dashboard'    },
  { id: 'history',  icon: faBook,        label: 'Quizzes' },
  { id: 'uploads',  icon: faCloudUploadAlt, label: 'Materials'    },
  { id: 'profile',  icon: faUser,           label: 'Profile'      },
];

const Dashboard = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, isAuthenticated, isLoading, logout, getUserRole } = useAuth();

  const initialTab = location.state?.tab;
  const [activeTab, setActiveTab]         = useState(initialTab === 'history' ? 'overview' : (initialTab || 'overview'));
  const [stats, setStats]                 = useState({ totalQuizzes: 0, averageScore: 0, studyStreak: 0, totalFlashcards: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [materials, setMaterials]         = useState([]);
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
      materialsService.getMine(),
    ])
      .then(([statsData, quizzes, flashcardDecks, materials]) => {
        setStats({
          totalQuizzes:    statsData.total_quizzes,
          averageScore:    statsData.average_score,
          studyStreak:     statsData.study_streak,
          totalFlashcards: statsData.total_flashcard_sets,
        });
        setMaterials(materials || []);

        // Merge quizzes + flashcard decks + materials into a single activity feed
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

        const materialActivity = (materials || []).map(m => ({
          id:   `material-${m.id}`,
          type: `material`,
          title: m.title,
          subtitle: `${m.file_size_display} · ${m.download_count} downloads`,
          created_at: m.created_at,
        }));

        const merged = [...quizActivity, ...deckActivity, ...materialActivity].sort(
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
    if (id === 'history') { navigate('/quiz'); return; }
    setActiveTab(id);
  };

  const statCards = [
    { icon: faBook,       label: 'Total Quizzes',  value: stats.totalQuizzes },
    { icon: faTrophy,     label: 'Average Score',  value: `${stats.averageScore}%` },
    { icon: faCalendar,   label: 'Study Streak',   value: `${stats.studyStreak}d` },
    { icon: faLayerGroup, label: 'Flashcard Sets', value: stats.totalFlashcards },
  ];

  const quickActions = [
    { icon: faBook,       title: 'Quiz',  desc: 'Generate a quiz from your notes', path: '/quiz' },
    { icon: faLayerGroup, title: 'Flashcards',   desc: 'Create smart flashcard sets',     path: '/flashcards'  },
    { icon: faRobot,      title: 'AI Tutor',     desc: 'Get instant personalised help',   path: '/ai-tutor'    },
  ];

  const activityIcon  = (type) => type === 'quiz' ? faBook : type === 'material' ? faCloudUploadAlt : faLayerGroup;
  const activityLabel = (type) => type === 'quiz' ? 'Quiz'  : type === 'material' ? 'Material uploaded' : 'Flashcards';

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
                {loadingStats ? (
                  <div className="db-empty">
                    <p>Loading your materials…</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-icon">📁</div>
                    <p>No materials uploaded yet. Upload a PDF to get started.</p>
                  </div>
                ) : (
                  <div className="db-materials-list">
                    {materials.map((material) => (
                      <div className="db-material-row" key={material.id}>
                        <div className="db-material-info">
                          <h3>{material.title || material.original_filename || 'Untitled material'}</h3>
                          <p>
                            {material.subject_label || material.subject || 'General'}
                            {material.file_size_display ? ` · ${material.file_size_display}` : ''}
                            {typeof material.download_count === 'number' ? ` · ${material.download_count} downloads` : ''}
                          </p>
                        </div>
                        <div className="db-material-meta">
                          <span className="db-material-badge">{material.subject_label || material.subject || 'General'}</span>
                          <span>{material.created_at ? new Date(material.created_at).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;