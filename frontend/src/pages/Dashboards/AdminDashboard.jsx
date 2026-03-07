import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faChartBar, faFileAlt, faComments, faLayerGroup,
  faCog, faTriangleExclamation, faTrophy, faBook, faUser
} from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';
import { dashboardService } from '../../services/dashboard';

const NAV_ITEMS = [
  { id: 'overview', icon: faChartBar, label: 'Overview' },
  { id: 'users', icon: faUsers, label: 'Users' },
  { id: 'content', icon: faFileAlt, label: 'Content' },
  { id: 'settings', icon: faCog, label: 'Settings' },
  { id: 'profile', icon: faUser, label: 'Profile' },
];

const nfmt = (v) => (typeof v === 'number' ? v.toLocaleString() : (v ?? '0'));

const FEATURE_TOGGLES = [
  { name: 'features_quiz_enabled', label: 'Quiz Feature' },
  { name: 'features_flashcard_enabled', label: 'Flashcard Feature' },
  { name: 'features_chat_enabled', label: 'Chat Feature' },
  { name: 'features_materials_enabled', label: 'Materials Upload' },
];

const SettingsTab = ({ settings, loading, saving, message, onSettingsChange, onMessageChange, onSavingChange }) => {
  const [formData, setFormData] = useState(settings || {});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    onMessageChange({ ok: '', err: '' });
    onSavingChange(true);

    try {
      const result = await dashboardService.updateSystemSettings(formData);
      onSettingsChange(result.data);
      onMessageChange({ ok: 'Settings saved successfully.', err: '' });
    } catch (err) {
      onMessageChange({ ok: '', err: err?.detail || 'Failed to save settings.' });
    } finally {
      onSavingChange(false);
    }
  };

  if (loading) {
    return (
      <div className="db-tab">
        <div className="db-page-header">
          <h1>System Settings</h1>
          <p>Configure platform parameters.</p>
        </div>
        <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-tab">
      <div className="db-page-header">
        <h1>System Settings</h1>
        <p>Configure platform parameters and feature toggles.</p>
      </div>

      {message.err && (
        <div className="db-card" style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '16px' }}>
          <span style={{ color: '#dc2626' }}>{message.err}</span>
        </div>
      )}
      {message.ok && (
        <div className="db-card" style={{ background: '#f0fdf4', borderLeft: '4px solid #16a34a', padding: '16px' }}>
          <span style={{ color: '#16a34a' }}>{message.ok}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="db-card">
          <h2>General</h2>
          <div className="db-form-row">
            <div className="db-field">
              <label>Platform Name</label>
              <input type="text" name="platform_name" value={formData.platform_name || ''} onChange={handleInputChange} />
            </div>
            <div className="db-field">
              <label>Support Email</label>
              <input type="email" name="support_email" value={formData.support_email || ''} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="db-card">
          <h2>Feature Toggles</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {FEATURE_TOGGLES.map(({ name, label }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span>{label}</span>
                <input type="checkbox" name={name} checked={formData[name] || false} onChange={handleInputChange} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="db-card">
          <h2>File Upload</h2>
          <div className="db-form-row">
            <div className="db-field">
              <label>Max Upload Size (MB)</label>
              <input type="number" name="max_upload_size_mb" min="1" max="1000" value={formData.max_upload_size_mb || 25} onChange={handleInputChange} />
            </div>
            <div className="db-field">
              <label>Allowed File Types (comma-separated)</label>
              <input type="text" name="allowed_file_types" value={formData.allowed_file_types || ''} onChange={handleInputChange} placeholder="pdf,docx,txt,..." />
            </div>
          </div>
        </div>

        <div className="db-card">
          <h2>Quiz Settings</h2>
          <div className="db-form-row">
            <div className="db-field">
              <label>Default Time Limit (minutes)</label>
              <input type="number" name="default_quiz_time_limit_minutes" min="1" max="300" value={formData.default_quiz_time_limit_minutes || 30} onChange={handleInputChange} />
            </div>
            <div className="db-field">
              <label>Max Questions Per Quiz</label>
              <input type="number" name="max_quiz_questions" min="1" max="500" value={formData.max_quiz_questions || 100} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="db-card">
          <h2>Rate Limiting</h2>
          <div className="db-form-row">
            <div className="db-field">
              <label>Chat Messages Per Day (0 = unlimited)</label>
              <input type="number" name="chatbot_daily_limit" min="0" value={formData.chatbot_daily_limit || 0} onChange={handleInputChange} />
            </div>
            <div className="db-field">
              <label>Quizzes Per Day (0 = unlimited)</label>
              <input type="number" name="quiz_daily_limit" min="0" value={formData.quiz_daily_limit || 0} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div className="db-card danger">
          <h2><FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 8 }} />Maintenance Mode</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            Enable maintenance mode to temporarily disable user access. Admins will still have full access.
          </p>
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Enable Maintenance Mode</span>
            <input type="checkbox" name="maintenance_mode" checked={formData.maintenance_mode || false} onChange={handleInputChange} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
          </div>
          <div className="db-field">
            <label>Maintenance Message (shown to users)</label>
            <textarea name="maintenance_message" value={formData.maintenance_message || ''} onChange={handleInputChange} placeholder="We're performing scheduled maintenance..." rows="3" style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="db-btn db-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
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

const AnalyticsLineChart = ({ labels = [], series = {} }) => {
  const width = 920;
  const height = 280;
  const padding = 28;
  const keys = [
    { id: 'new_users', label: 'New Users', color: '#f59e0b' },
    { id: 'quizzes', label: 'Quizzes', color: '#22c55e' },
    { id: 'decks', label: 'Decks', color: '#38bdf8' },
    { id: 'chat_messages', label: 'Chat Messages', color: '#0d2170' },
    { id: 'uploaded_materials', label: 'Materials', color: '#921e1e' },
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

      <div className="usage-chart-scroll">
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
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'overview');
  const [adminStats, setAdminStats] = useState({});
  const [users, setUsers] = useState([]);
  const [usageTrends, setUsageTrends] = useState({ labels: [], series: {} });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ ok: '', err: '' });

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

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Load settings when component mounts or settings tab is clicked
  useEffect(() => {
    if (activeTab === 'settings' && !systemSettings && !loadingSettings) {
      setLoadingSettings(true);
      dashboardService.getSystemSettings()
        .then(setSystemSettings)
        .catch(err => {
          console.error('Failed to load settings:', err);
          setSettingsMessage({ ok: '', err: 'Failed to load settings' });
        })
        .finally(() => setLoadingSettings(false));
    }
  }, [activeTab, systemSettings, loadingSettings]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNavigate = (id) => {
    if (id === 'profile') {
      navigate('/profile');
      return;
    }
    setActiveTab(id);
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
    { icon: faComments, label: 'Chat Messages', value: nfmt(adminStats.total_chat_messages) },
    { icon: faChartBar, label: 'Quizzes', value: nfmt(adminStats.total_quizzes) },
    { icon: faChartBar, label: 'Quiz Questions', value: nfmt(adminStats.total_quiz_questions) },
    { icon: faFileAlt, label: 'Flashcard Decks', value: nfmt(adminStats.total_flashcard_decks) },
    { icon: faLayerGroup, label: 'Flashcards', value: nfmt(adminStats.total_flashcards) },
    { icon: faBook, label: 'Uploaded Materials', value: nfmt(adminStats.total_materials) },
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
          onNavigate={handleNavigate}
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

              <div className="db-stats-grid db-stats-grid--two">
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
                <div className="db-card-header"><h2>Usage Analytics (14 Days)</h2></div>
                {loadingTrends ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading analytics...</p>
                ) : (
                  <AnalyticsLineChart labels={usageTrends.labels} series={usageTrends.series} />
                )}
              </div>

              <div className="db-card">
                <div className="db-card-header">
                  <h2>Recent Real Activity (Last 24 Hours)</h2>
                  <button
                    type="button"
                    className="db-btn db-btn-ghost db-btn-sm"
                    onClick={() => navigate('/admin-dashboard/activity')}
                  >
                    View All Activity
                  </button>
                </div>
                <div className="db-timeline">
                  {(adminStats.recent_activity || []).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No activity in the past 24 hours.</p>
                  ) : (
                    (adminStats.recent_activity || []).map((item, idx) => (
                      <div className="db-timeline-item" key={`${item.type}-${item.created_at}-${idx}`}>
                        <div className="db-timeline-dot" />
                        <div className="db-timeline-body">
                          <h4>{item.actor}</h4>
                          <p>{item.text}</p>
                          <span>{formatRelativeTime(item.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="db-card">
                <div className="db-card-header"><h2>Estimated Token Usage</h2></div>
                <div className="db-stats-grid db-stats-grid--two">
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
                          <td data-label="Username" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.username}</td>
                          <td data-label="Email">{u.email}</td>
                          <td data-label="Joined">{u.date_joined}</td>
                          <td data-label="Quizzes" style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{u.total_quizzes ?? 0}</td>
                          <td data-label="Flashcards" style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{u.total_flashcard_sets ?? 0}</td>
                          <td data-label="Chats" style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{u.total_chats ?? 0}</td>
                          <td data-label="Status">
                            <span className={`db-badge ${u.is_email_verified ? 'db-badge-green' : 'db-badge-gray'}`}>
                              {u.is_email_verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                              <button
                                className="db-btn db-btn-ghost db-btn-sm"
                                title="View user details"
                                onClick={() => navigate(`/admin-dashboard/user/${u.id}`)}
                              >
                                View
                              </button>
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
            <SettingsTab
              settings={systemSettings}
              loading={loadingSettings}
              saving={savingSettings}
              message={settingsMessage}
              onSettingsChange={setSystemSettings}
              onMessageChange={setSettingsMessage}
              onSavingChange={setSavingSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
