import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faChartBar, faFileAlt, faRightFromBracket,
  faCog, faTriangleExclamation, faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';
import { dashboardService } from '../../services/dashboard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [activeTab, setActiveTab]   = useState('overview');
  const [adminStats, setAdminStats] = useState({});
  const [users, setUsers]           = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (getUserRole() !== 'admin') navigate('/dashboard');
  }, [isAuthenticated, navigate, getUserRole]);

  // Fetch data
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
  }, [isAuthenticated, getUserRole]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Remove this user? This cannot be undone.')) return;
    try {
      await dashboardService.removeUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to remove user:', err);
    }
  };

  const navItems = [
    { id: 'overview', icon: faChartBar, label: 'Overview' },
    { id: 'users',    icon: faUsers,    label: 'Users'    },
    { id: 'content',  icon: faFileAlt,  label: 'Content'  },
    { id: 'settings', icon: faCog,      label: 'Settings' },
  ];

  const statCards = [
    { icon: faUsers,    label: 'Total Users',        value: adminStats.total_users     },
    { icon: faChartBar, label: 'Quizzes Created',    value: adminStats.total_quizzes   },
    { icon: faFileAlt,  label: 'Materials Uploaded', value: adminStats.total_materials },
    { icon: faTrophy,   label: 'Avg. Score',         value: adminStats.average_score != null ? `${adminStats.average_score}%` : undefined },
  ];

  return (
    <div className="db-container">
      <Navbar />
      <div className="db-wrapper">

        {/* ── Sidebar ── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-user">
            <div className="db-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <h3>{user?.username}</h3>
            <p>{user?.email}</p>
            <span className="db-role-badge admin">Admin</span>
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
                <h1>Admin Dashboard</h1>
                <p>System overview and key metrics.</p>
              </div>

              <div className="db-stats-grid">
                {statCards.map(({ icon, label, value }) => (
                  <div className="db-stat-card" key={label}>
                    <div className="db-stat-icon"><FontAwesomeIcon icon={icon} /></div>
                    <div className="db-stat-body">
                      <p>{label}</p>
                      <h3>{loadingStats ? '—' : (value ?? '0')}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="db-card">
                <div className="db-card-header"><h2>Recent Activity</h2></div>
                <div className="db-timeline">
                  {[
                    { title: 'New user signup',   desc: 'John Doe created an account',       time: '5 min ago'   },
                    { title: 'Quiz completed',    desc: 'User completed "Biology Basics"',   time: '1 hour ago'  },
                    { title: 'Material uploaded', desc: 'Chemistry notes uploaded (2.4 MB)', time: '3 hours ago' },
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
            </div>
          )}

          {/* ── Users ── */}
          {activeTab === 'users' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>User Management</h1>
                <p>Monitor and manage user accounts.</p>
              </div>

              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Quizzes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                          Loading users…
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.email}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.date_joined}</td>
                          <td>{u.total_quizzes ?? 0}</td>
                          <td>
                            <span className={`db-badge ${u.is_email_verified ? 'db-badge-green' : 'db-badge-gray'}`}>
                              {u.is_email_verified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="db-btn db-btn-ghost db-btn-sm">View</button>
                              <button
                                className="db-btn db-btn-danger db-btn-sm"
                                onClick={() => handleRemoveUser(u.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {activeTab === 'content' && (
            <div className="db-tab">
              <div className="db-page-header">
                <h1>Content Management</h1>
                <p>Monitor user-generated content.</p>
              </div>
              <div className="db-card">
                <h2>Uploaded Materials</h2>
                <div className="db-empty">
                  <div className="db-empty-icon">📁</div>
                  <p>Content management coming soon.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
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
                  <div>
                    <button type="submit" className="db-btn db-btn-primary">Save Settings</button>
                  </div>
                </form>
              </div>

              <div className="db-card danger">
                <h2>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 8 }} />
                  Danger Zone
                </h2>
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