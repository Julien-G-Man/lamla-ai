import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faHistory,
  faCloudUploadAlt,
  faLock,
  faUser,
  faLogout,
  faChevronRight,
  faBook,
  faTrophy,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    studyStreak: 0,
    totalFlashcards: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user is admin - redirect to admin dashboard
    const role = getUserRole();
    if (role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [isAuthenticated, navigate, getUserRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-wrapper">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <h3>{user?.first_name} {user?.last_name}</h3>
            <p>{user?.email}</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FontAwesomeIcon icon={faHome} /> Dashboard
            </button>
            <button
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FontAwesomeIcon icon={faHistory} /> Past Quizzes
            </button>
            <button
              className={`nav-item ${activeTab === 'uploads' ? 'active' : ''}`}
              onClick={() => setActiveTab('uploads')}
            >
              <FontAwesomeIcon icon={faCloudUploadAlt} /> Materials
            </button>
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FontAwesomeIcon icon={faUser} /> Profile
            </button>
            <button
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <FontAwesomeIcon icon={faLock} /> Security
            </button>
          </nav>

          <button className="sidebar-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faLogout} /> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="dashboard-tab">
              <div className="tab-header">
                <h1>Dashboard</h1>
                <p>Welcome back! Here's your study summary.</p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <FontAwesomeIcon icon={faBook} className="stat-icon" />
                  <div className="stat-content">
                    <p className="stat-label">Total Quizzes</p>
                    <h3 className="stat-value">{stats.totalQuizzes}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <FontAwesomeIcon icon={faTrophy} className="stat-icon" />
                  <div className="stat-content">
                    <p className="stat-label">Average Score</p>
                    <h3 className="stat-value">{stats.averageScore}%</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <FontAwesomeIcon icon={faCalendar} className="stat-icon" />
                  <div className="stat-content">
                    <p className="stat-label">Study Streak</p>
                    <h3 className="stat-value">{stats.studyStreak} days</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="stat-icon" />
                  <div className="stat-content">
                    <p className="stat-label">Flashcard Sets</p>
                    <h3 className="stat-value">{stats.totalFlashcards}</h3>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => navigate('/custom-quiz')}>
                    <FontAwesomeIcon icon={faBook} />
                    <h3>Create Quiz</h3>
                    <p>Generate a new custom quiz</p>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                  <button className="action-card" onClick={() => navigate('/flashcards')}>
                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                    <h3>Create Flashcards</h3>
                    <p>Upload materials for flashcards</p>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                  <button className="action-card" onClick={() => navigate('/ai-tutor')}>
                    <FontAwesomeIcon icon={faBook} />
                    <h3>Ask AI Tutor</h3>
                    <p>Get personalized help</p>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>

              <section className="recent-section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">Completed Biology Quiz</p>
                      <p className="activity-date">2 hours ago</p>
                    </div>
                    <span className="activity-score">85%</span>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FontAwesomeIcon icon={faCloudUploadAlt} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">Uploaded Chemistry Notes</p>
                      <p className="activity-date">1 day ago</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">
                      <FontAwesomeIcon icon={faBook} />
                    </div>
                    <div className="activity-content">
                      <p className="activity-title">Completed History Quiz</p>
                      <p className="activity-date">3 days ago</p>
                    </div>
                    <span className="activity-score">92%</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="dashboard-tab">
              <div className="tab-header">
                <h1>Past Quizzes</h1>
                <p>Review your quiz history and performance</p>
              </div>

              <div className="quizzes-list">
                <div className="quiz-item">
                  <div className="quiz-info">
                    <h3>Biology Basics</h3>
                    <p>10 questions • 10 minutes</p>
                    <p className="quiz-date">Completed 2 hours ago</p>
                  </div>
                  <div className="quiz-score">85%</div>
                  <button className="review-btn">Review</button>
                </div>

                <div className="quiz-item">
                  <div className="quiz-info">
                    <h3>History of Civilizations</h3>
                    <p>15 questions • 15 minutes</p>
                    <p className="quiz-date">Completed 3 days ago</p>
                  </div>
                  <div className="quiz-score">92%</div>
                  <button className="review-btn">Review</button>
                </div>

                <div className="quiz-item">
                  <div className="quiz-info">
                    <h3>Physics Fundamentals</h3>
                    <p>12 questions • 12 minutes</p>
                    <p className="quiz-date">Completed 1 week ago</p>
                  </div>
                  <div className="quiz-score">78%</div>
                  <button className="review-btn">Review</button>
                </div>
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'uploads' && (
            <div className="dashboard-tab">
              <div className="tab-header">
                <h1>My Materials</h1>
                <p>Manage your uploaded study materials</p>
              </div>

              <div className="materials-actions">
                <button className="upload-material-btn" onClick={() => navigate('/flashcards')}>
                  <FontAwesomeIcon icon={faCloudUploadAlt} /> Upload Material
                </button>
              </div>

              <div className="materials-list">
                <div className="material-item">
                  <div className="material-icon">📄</div>
                  <div className="material-info">
                    <h3>Biology Notes.pdf</h3>
                    <p>Uploaded 2 days ago • 2.4 MB</p>
                  </div>
                  <div className="material-actions">
                    <button className="action-icon" title="View">👁️</button>
                    <button className="action-icon" title="Delete">🗑️</button>
                  </div>
                </div>

                <div className="material-item">
                  <div className="material-icon">📝</div>
                  <div className="material-info">
                    <h3>Chemistry Study Guide.docx</h3>
                    <p>Uploaded 1 week ago • 1.8 MB</p>
                  </div>
                  <div className="material-actions">
                    <button className="action-icon" title="View">👁️</button>
                    <button className="action-icon" title="Delete">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="dashboard-tab">
              <div className="tab-header">
                <h1>Profile Settings</h1>
                <p>Manage your account information</p>
              </div>

              <div className="profile-section">
                <div className="profile-avatar-section">
                  <div className="profile-avatar">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <button className="change-avatar-btn">Change Photo</button>
                </div>

                <form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" defaultValue={user?.first_name} />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" defaultValue={user?.last_name} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" defaultValue={user?.email} />
                  </div>

                  <button type="submit" className="save-btn">Save Changes</button>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="dashboard-tab">
              <div className="tab-header">
                <h1>Security Settings</h1>
                <p>Manage your account security</p>
              </div>

              <div className="security-section">
                <h2>Change Password</h2>
                <form className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>

                  <button type="submit" className="save-btn">Update Password</button>
                </form>
              </div>

              <div className="security-section danger">
                <h2>Danger Zone</h2>
                <p>Permanently delete your account</p>
                <button className="delete-account-btn">Delete Account</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
