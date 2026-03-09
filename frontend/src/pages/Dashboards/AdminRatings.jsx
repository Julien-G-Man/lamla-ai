import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faChartBar, faFileAlt, faCog, faArrowLeft, faStar,
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard';
import './AdminDashboard.css';

const NAV_ITEMS = [
  { id: 'overview', icon: faChartBar, label: 'Overview' },
  { id: 'users', icon: faUsers, label: 'Users' },
  { id: 'content', icon: faFileAlt, label: 'Content' },
  { id: 'settings', icon: faCog, label: 'Settings' },
];

const nfmt = (v) => (typeof v === 'number' ? v.toLocaleString() : (v ?? '0'));

const formatRelativeTime = (isoDate) => {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return '';
  const secs = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

export default function AdminRatings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [feedbackData, setFeedbackData] = useState({ ratings: [], total: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (getUserRole() !== 'admin') navigate('/dashboard');
  }, [isAuthenticated, getUserRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;

    dashboardService.getAdminQuizFeedback(200)
      .then(setFeedbackData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, getUserRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNavigate = (tab) => {
    navigate('/admin-dashboard', { state: { tab } });
  };

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-wrapper">
        <Sidebar
          user={user}
          navItems={NAV_ITEMS}
          activeId="overview"
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          variant="admin"
        />

        <main className="db-main">
          <div className="db-tab">
            <div className="db-page-header">
              <button 
                className="db-btn db-btn-ghost db-btn-sm" 
                onClick={() => navigate('/admin-dashboard')}
                style={{ marginBottom: '12px' }}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Dashboard
              </button>
              <h1>All Quiz Experience Ratings</h1>
              <p>View all user ratings and feedback for quiz experiences.</p>
            </div>

            <div className="db-card">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '24px', 
                padding: '20px', 
                background: 'rgba(251, 191, 36, 0.1)', 
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <FontAwesomeIcon icon={faStar} style={{ fontSize: '2.5rem', color: '#fbbf24', marginBottom: '8px' }} />
                  <h2 style={{ margin: 0, fontSize: '2rem', color: '#fbbf24' }}>
                    {loading ? '-' : (feedbackData.average_rating || 0).toFixed(2)}
                  </h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Average Rating
                  </p>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                    {loading ? '-' : nfmt(feedbackData.total || 0)}
                  </h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Total Ratings
                  </p>
                </div>
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '48px' }}>
                  Loading ratings...
                </p>
              ) : !feedbackData.ratings || feedbackData.ratings.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '48px' }}>
                  No ratings submitted yet. Users can rate their quiz experience after completing quizzes.
                </p>
              ) : (
                <div className="db-ratings-list">
                  {feedbackData.ratings.map((item, idx) => (
                    <div className="db-rating-item" key={`${item.actor}-${item.created_at}-${idx}`}>
                      <div>
                        <p className="db-rating-actor">
                          {item.actor}
                          {item.is_authenticated && (
                            <span style={{ 
                              marginLeft: '8px', 
                              fontSize: '0.75rem', 
                              color: '#10b981', 
                              fontWeight: 'normal' 
                            }}>
                              ✓ Verified
                            </span>
                          )}
                        </p>
                        <span className="db-rating-time">{formatRelativeTime(item.created_at)}</span>
                      </div>
                      <strong className="db-rating-score">{item.rating}/5 ★</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
