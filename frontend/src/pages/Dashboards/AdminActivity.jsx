import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faChartBar, faFileAlt, faCog, faUser } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

const NAV_ITEMS = [
  { id: 'overview', icon: faChartBar, label: 'Overview' },
  { id: 'users', icon: faUsers, label: 'Users' },
  { id: 'content', icon: faFileAlt, label: 'Content' },
  { id: 'settings', icon: faCog, label: 'Settings' },
  { id: 'activity', icon: faChartBar, label: 'Activity' },
  { id: 'profile', icon: faUser, label: 'Profile' },
];

const PERIOD_OPTIONS = [
  { id: 'day', label: '24 Hours' },
  { id: 'week', label: '7 Days' },
  { id: 'month', label: '30 Days' },
  { id: 'quarter', label: '90 Days' },
  { id: 'year', label: '1 Year' },
  { id: 'all', label: 'All Time' },
];

const typeLabel = {
  quiz: 'Quizzes',
  flashcards: 'Flashcards',
  chat: 'Chats',
  material: 'Materials',
};

const formatRelativeTime = (isoDate) => {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return '';
  const seconds = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const AdminActivity = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, getUserRole, logout } = useAuth();

  const [period, setPeriod] = useState('week');
  const [payload, setPayload] = useState({ activities: [], counts: {}, total: 0, has_more: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadActivity = async (selectedPeriod, offset = 0, append = false) => {
    const loadSetter = append ? setLoadingMore : setLoading;
    loadSetter(true);
    if (!append) setError('');

    try {
      const data = await dashboardService.getAdminActivity({
        period: selectedPeriod,
        offset,
        limit: 50,
      });

      setPayload((prev) => ({
        ...data,
        activities: append ? [...(prev.activities || []), ...(data.activities || [])] : (data.activities || []),
      }));
    } catch (err) {
      console.error('Failed to load admin activity:', err);
      if (!append) setError('Could not load activity feed. Please try again.');
    } finally {
      loadSetter(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (getUserRole() !== 'admin') navigate('/dashboard');
  }, [isAuthenticated, navigate, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    loadActivity(period);
  }, [period, isAuthenticated, getUserRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNavigate = (id) => {
    if (id === 'activity') return;
    if (id === 'profile') {
      navigate('/profile');
      return;
    }
    navigate('/admin-dashboard', { state: { tab: id } });
  };

  const activityStats = useMemo(() => {
    const counts = payload.counts || {};
    return [
      { label: 'Total', value: payload.total ?? 0 },
      { label: typeLabel.quiz, value: counts.quiz ?? 0 },
      { label: typeLabel.flashcards, value: counts.flashcards ?? 0 },
      { label: typeLabel.chat, value: counts.chat ?? 0 },
      { label: typeLabel.material, value: counts.material ?? 0 },
    ];
  }, [payload]);

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-wrapper">
        <Sidebar
          user={user}
          navItems={NAV_ITEMS}
          activeId="activity"
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          variant="admin"
        />

        <main className="db-main">
          <div className="db-page-header">
            <h1>Activity Explorer</h1>
            <p>Review platform activity across custom time windows.</p>
          </div>

          <div className="db-card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`db-btn ${period === opt.id ? 'db-btn-primary' : 'db-btn-ghost'}`}
                onClick={() => setPeriod(opt.id)}
                disabled={loading || loadingMore}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="db-stats-grid db-stats-grid--two">
            {activityStats.map((item) => (
              <div className="db-stat-card" key={item.label}>
                <div className="db-stat-body">
                  <p>{item.label}</p>
                  <h3>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="db-card">
            <div className="db-card-header">
              <h2>Activity Feed</h2>
              <button type="button" className="db-btn db-btn-ghost db-btn-sm" onClick={() => navigate('/admin-dashboard')}>
                <FontAwesomeIcon icon={faChartBar} /> Dashboard
              </button>
            </div>

            {error && <p style={{ color: '#ef4444', marginTop: 0 }}>{error}</p>}

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading activity...</p>
            ) : (payload.activities || []).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No activity found for this period.</p>
            ) : (
              <div className="db-timeline">
                {(payload.activities || []).map((item, idx) => (
                  <div className="db-timeline-item" key={`${item.type}-${item.created_at}-${idx}`}>
                    <div className="db-timeline-dot" />
                    <div className="db-timeline-body">
                      <h4>{item.actor}</h4>
                      <p>{item.text}</p>
                      <span>{formatRelativeTime(item.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && payload.has_more && (
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="db-btn db-btn-ghost"
                  onClick={() => loadActivity(period, (payload.activities || []).length, true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminActivity;
