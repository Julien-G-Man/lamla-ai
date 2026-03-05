import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faChartBar, faFileAlt, faComments, faLayerGroup,
  faCog, faTriangleExclamation, faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';
import { dashboardService } from '../../services/dashboard';

const NAV_ITEMS = [
  { id: 'overview', icon: faChartBar, label: 'Overview' },
  { id: 'users', icon: faUsers, label: 'Users' },
  { id: 'content', icon: faFileAlt, label: 'Content' },
  { id: 'settings', icon: faCog, label: 'Settings' },
];

const nfmt = (v) => (typeof v === 'number' ? v.toLocaleString() : (v ?? '0'));

const AnalyticsLineChart = ({ labels = [], series = {} }) => {
  const width = 920;
  const height = 280;
  const padding = 28;
  const keys = [
    { id: 'new_users', label: 'New Users', color: '#f59e0b' },
    { id: 'quizzes', label: 'Quizzes', color: '#22c55e' },
    { id: 'decks', label: 'Decks', color: '#38bdf8' },
    { id: 'chat_messages', label: 'Chat Messages', color: '#ef4444' },
  ];

  const maxVal = Math.max(
    1,
    ...keys.flatMap((k) => series[k.id] || [0]),
  );

  const xFor = (idx) => {
    if (labels.length <= 1) return padding;
    const span = width - padding * 2;
    return padding + (idx / (labels.length - 1)) * span;
  };

  const yFor = (val) => {
    const span = height - padding * 2;
    return height - padding - (val / maxVal) * span;
  };

  const pointsFor = (arr = []) => arr.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = Math.round((maxVal / ticks) * i);
    return { value: v, y: yFor(v) };
  });

  const compactLabel = (isoDate) => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="usage-chart-wrap">
      <div className="usage-chart-legend">
        {keys.map((k) => (
          <span key={k.id} className="usage-legend-item">
            <i style={{ background: k.color }} />
            {k.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="usage-chart-svg" role="img" aria-label="Usage analytics chart">
        {yTicks.map((t) => (
          <g key={t.value}>
            <line
              x1={padding}
              x2={width - padding}
              y1={t.y}
              y2={t.y}
              stroke="rgba(148,163,184,0.25)"
              strokeWidth="1"
            />
            <text x={4} y={t.y + 4} fontSize="11" fill="#94a3b8">{t.value}</text>
          </g>
        ))}

        {keys.map((k) => (
          <polyline
            key={k.id}
            fill="none"
            stroke={k.color}
            strokeWidth="2.5"
            points={pointsFor(series[k.id] || [])}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {labels.map((label, i) => {
          if (!(i === 0 || i === labels.length - 1 || i % 3 === 0)) return null;
          return (
            <text
              key={`${label}-${i}`}
              x={xFor(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize="10.5"
              fill="#94a3b8"
            >
              {compactLabel(label)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminStats, setAdminStats] = useState({});
  const [users, setUsers] = useState([]);
  const [usageTrends, setUsageTrends] = useState({ labels: [], series: {} });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (getUserRole() !== 'admin') navigate('/dashboard');
  }, [isAuthenticated, navigate, getUserRole]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;

    dashboardService.getAdminStats()
      .then(setAdminStats)
      .catch(console.error)
      .finally(() => setLoadingStats(false));

    dashboardService.getAdminUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoadingUsers(false));

    dashboardService.getAdminUsageTrends(14)
      .then(setUsageTrends)
      .catch(console.error)
      .finally(() => setLoadingTrends(false));
  }, [isAuthenticated, getUserRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Remove this user? This cannot be undone.')) return;
    try {
      await dashboardService.removeUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to remove user:', err);
    }
  };

  const statCards = [
    { icon: faUsers, label: 'Total Users', value: nfmt(adminStats.total_users) },
    { icon: faChartBar, label: 'Quizzes', value: nfmt(adminStats.total_quizzes) },
    { icon: faLayerGroup, label: 'Flashcards', value: nfmt(adminStats.total_flashcards) },
    { icon: faComments, label: 'Chat Messages', value: nfmt(adminStats.total_chat_messages) },
    { icon: faFileAlt, label: 'Decks', value: nfmt(adminStats.total_materials) },
    {
      icon: faTrophy,
      label: 'Avg Score',
      value: adminStats.average_score != null ? `${adminStats.average_score}%` : '0%',
    },
    {
      icon: faChartBar,
      label: 'Token Burn (Est.)',
      value: nfmt(adminStats.estimated_tokens?.total),
    },
  ];

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-wrapper">
        <Sidebar
          user={user}
          navItems={NAV_ITEMS}
          activeId={activeTab}
          onNavigate={setActiveTab}
          onLogout={handleLogout}
          variant="admin"
        />

        <main className="db-main">
          {activeTab === 'overview' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Admin Dashboard</h1>
                <p>Global usage, engagement, and AI consumption metrics.</p>
              </div>

              <div className="db-stats-grid">
                {statCards.map(({ icon, label, value }) => (
                  <div className="db-stat-card" key={label}>
                    <div className="db-stat-icon"><FontAwesomeIcon icon={icon} /></div>
                    <div className="db-stat-body">
                      <p>{label}</p>
                      <h3>{loadingStats ? '-' : value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="db-card">
                <div className="db-card-header"><h2>Last 24 Hours</h2></div>
                <div className="db-timeline">
                  {[
                    { title: 'New Users', desc: `${nfmt(adminStats.activity_24h?.new_users)} joined`, time: '24h' },
                    { title: 'Quizzes', desc: `${nfmt(adminStats.activity_24h?.quizzes)} completed`, time: '24h' },
                    { title: 'Decks / Flashcards', desc: `${nfmt(adminStats.activity_24h?.decks)} decks, ${nfmt(adminStats.activity_24h?.flashcards)} cards`, time: '24h' },
                    { title: 'Chat Messages', desc: `${nfmt(adminStats.activity_24h?.chat_messages)} sent`, time: '24h' },
                  ].map(({ title, desc, time }) => (
                    <div className="db-timeline-item" key={title}>
                      <div className="db-timeline-dot" />
                      <div className="db-timeline-body">
                        <h4>{title}</h4>
                        <p>{desc}</p>
                        <span>{time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="db-card">
                <div className="db-card-header"><h2>Usage Analytics (14 Days)</h2></div>
                {loadingTrends ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
                ) : (
                  <AnalyticsLineChart labels={usageTrends.labels} series={usageTrends.series} />
                )}
              </div>

              <div className="db-card">
                <div className="db-card-header"><h2>Estimated Token Usage</h2></div>
                <div className="db-stats-grid">
                  <div className="db-stat-card">
                    <div className="db-stat-body"><p>Chat</p><h3>{nfmt(adminStats.estimated_tokens?.chat)}</h3></div>
                  </div>
                  <div className="db-stat-card">
                    <div className="db-stat-body"><p>Quiz</p><h3>{nfmt(adminStats.estimated_tokens?.quiz)}</h3></div>
                  </div>
                  <div className="db-stat-card">
                    <div className="db-stat-body"><p>Flashcards</p><h3>{nfmt(adminStats.estimated_tokens?.flashcards)}</h3></div>
                  </div>
                  <div className="db-stat-card">
                    <div className="db-stat-body"><p>Total</p><h3>{nfmt(adminStats.estimated_tokens?.total)}</h3></div>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 10 }}>
                  {adminStats.estimated_tokens?.note || 'Approximation based on stored text volume.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>User Management</h1>
                <p>View user-level engagement across quiz, flashcards, and chat.</p>
              </div>

              {loadingUsers ? (
                <div className="db-card">
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
                    <p>Loading users...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="db-card">
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No users found.</p>
                  </div>
                </div>
              ) : (
                <div className="db-table-wrap">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Quizzes</th>
                        <th>Flashcards</th>
                        <th>Chats</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.date_joined}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{u.total_quizzes ?? 0}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{u.total_flashcard_sets ?? 0}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{u.total_chats ?? 0}</td>
                          <td>
                            <span className={`db-badge ${u.is_email_verified ? 'db-badge-green' : 'db-badge-gray'}`}>
                              {u.is_email_verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                              <button className="db-btn db-btn-ghost db-btn-sm" title="View user details">View</button>
                              <button
                                className="db-btn db-btn-danger db-btn-sm"
                                onClick={() => handleRemoveUser(u.id)}
                                title="Remove user account"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Content Management</h1>
                <p>Platform-wide content inventory.</p>
              </div>
              <div className="db-card">
                <h2>Content Totals</h2>
                <div className="db-stats-grid">
                  <div className="db-stat-card"><div className="db-stat-body"><p>Quiz Questions</p><h3>{nfmt(adminStats.total_quiz_questions)}</h3></div></div>
                  <div className="db-stat-card"><div className="db-stat-body"><p>Chat Sessions</p><h3>{nfmt(adminStats.total_chat_sessions)}</h3></div></div>
                  <div className="db-stat-card"><div className="db-stat-body"><p>Avg Quizzes/User</p><h3>{nfmt(adminStats.avg_quizzes_per_user)}</h3></div></div>
                  <div className="db-stat-card"><div className="db-stat-body"><p>Avg Chats/User</p><h3>{nfmt(adminStats.avg_chats_per_user)}</h3></div></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>System Settings</h1>
                <p>Configure platform parameters.</p>
              </div>

              <div className="db-card">
                <h2>General</h2>
                <form className="db-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="db-form-row">
                    <div className="db-field">
                      <label>Platform Name</label>
                      <input type="text" defaultValue="Lamla AI" />
                    </div>
                    <div className="db-field">
                      <label>Max Upload Size (MB)</label>
                      <input type="number" defaultValue="25" />
                    </div>
                  </div>
                  <div className="db-field" style={{ maxWidth: 300 }}>
                    <label>Quiz Time Limit (min)</label>
                    <input type="number" defaultValue="30" />
                  </div>
                  <button type="submit" className="db-btn db-btn-primary">Save Settings</button>
                </form>
              </div>

              <div className="db-card danger">
                <h2><FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 8 }} />Danger Zone</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
                  Irreversible system actions. Proceed with caution.
                </p>
                <button className="db-btn db-btn-danger">
                  <FontAwesomeIcon icon={faTriangleExclamation} /> Clear All Cache
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
