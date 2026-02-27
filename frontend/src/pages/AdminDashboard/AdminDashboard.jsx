import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faChartBar,
  faFileAlt,
  faRightFromBracket,
  faCog,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const role = getUserRole();
    if (role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, getUserRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard-wrapper">
        {/* Admin Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-user">
            <div className="admin-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <h3>Admin Panel</h3>
            <p>{user?.email}</p>
          </div>

          <nav className="admin-nav">
            <button
              className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FontAwesomeIcon icon={faChartBar} /> Overview
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <FontAwesomeIcon icon={faUsers} /> Users
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <FontAwesomeIcon icon={faFileAlt} /> Content
            </button>
            <button
              className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <FontAwesomeIcon icon={faCog} /> Settings
            </button>
          </nav>

          <button className="admin-logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} /> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="admin-tab">
              <div className="admin-tab-header">
                <h1>Admin Dashboard</h1>
                <p>System overview and key metrics</p>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <FontAwesomeIcon icon={faUsers} className="admin-stat-icon" />
                  <div className="admin-stat-info">
                    <p>Total Users</p>
                    <h3>1,247</h3>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <FontAwesomeIcon icon={faChartBar} className="admin-stat-icon" />
                  <div className="admin-stat-info">
                    <p>Quizzes Created</p>
                    <h3>3,821</h3>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <FontAwesomeIcon icon={faFileAlt} className="admin-stat-icon" />
                  <div className="admin-stat-info">
                    <p>Materials Uploaded</p>
                    <h3>892</h3>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <FontAwesomeIcon icon={faChartBar} className="admin-stat-icon" />
                  <div className="admin-stat-info">
                    <p>Avg. Score</p>
                    <h3>84%</h3>
                  </div>
                </div>
              </div>

              <section className="admin-section">
                <h2>Recent Activity</h2>
                <div className="activity-timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>New user signup</h4>
                      <p>John Doe created an account</p>
                      <span>5 minutes ago</span>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Quiz completed</h4>
                      <p>User completed "Biology Basics"</p>
                      <span>1 hour ago</span>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Material uploaded</h4>
                      <p>Chemistry notes uploaded (2.4 MB)</p>
                      <span>3 hours ago</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="admin-tab">
              <div className="admin-tab-header">
                <h1>User Management</h1>
                <p>Manage and monitor user accounts</p>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Quizzes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe</td>
                      <td>john@example.com</td>
                      <td>Jan 15, 2024</td>
                      <td>12</td>
                      <td>
                        <button className="action-link">View</button>
                        <button className="action-link danger">Remove</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>jane@example.com</td>
                      <td>Jan 10, 2024</td>
                      <td>8</td>
                      <td>
                        <button className="action-link">View</button>
                        <button className="action-link danger">Remove</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Mike Johnson</td>
                      <td>mike@example.com</td>
                      <td>Jan 5, 2024</td>
                      <td>15</td>
                      <td>
                        <button className="action-link">View</button>
                        <button className="action-link danger">Remove</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="admin-tab">
              <div className="admin-tab-header">
                <h1>Content Management</h1>
                <p>Monitor and manage user-generated content</p>
              </div>

              <div className="content-management">
                <section className="admin-section">
                  <h2>Uploaded Materials</h2>
                  <div className="content-list">
                    <div className="content-item">
                      <div className="content-meta">
                        <h4>Biology Notes.pdf</h4>
                        <p>Uploaded by John Doe • 2.4 MB</p>
                        <span className="content-date">2 hours ago</span>
                      </div>
                      <div className="content-actions">
                        <button className="content-action">Review</button>
                        <button className="content-action danger">Remove</button>
                      </div>
                    </div>

                    <div className="content-item">
                      <div className="content-meta">
                        <h4>Chemistry Guide.docx</h4>
                        <p>Uploaded by Jane Smith • 1.8 MB</p>
                        <span className="content-date">1 day ago</span>
                      </div>
                      <div className="content-actions">
                        <button className="content-action">Review</button>
                        <button className="content-action danger">Remove</button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="admin-tab">
              <div className="admin-tab-header">
                <h1>System Settings</h1>
                <p>Configure system parameters</p>
              </div>

              <div className="settings-section">
                <h2>General Settings</h2>
                <form className="settings-form">
                  <div className="form-group">
                    <label>Platform Name</label>
                    <input type="text" defaultValue="Lamla AI" />
                  </div>

                  <div className="form-group">
                    <label>Max File Upload Size (MB)</label>
                    <input type="number" defaultValue="25" />
                  </div>

                  <div className="form-group">
                    <label>Quiz Time Limit (minutes)</label>
                    <input type="number" defaultValue="30" />
                  </div>

                  <button type="submit" className="save-btn">Save Settings</button>
                </form>
              </div>

              <div className="settings-section danger">
                <h2>Danger Zone</h2>
                <p>Irreversible actions</p>
                <button className="danger-btn">
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
