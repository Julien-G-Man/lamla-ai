import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAppShell from '../../components/AppShell/AdminAppShell';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard';
import './AdminDashboard.css';

const nfmt = (v) => (typeof v === 'number' ? v.toLocaleString() : (v ?? '0'));

export default function AdminUsers() {
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (getUserRole() !== 'admin') navigate('/dashboard');
  }, [isAuthenticated, getUserRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;

    dashboardService.getAdminUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, [isAuthenticated, getUserRole]);

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Remove this user? This cannot be undone.')) return;
    try {
      await dashboardService.removeUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to remove user:', err);
    }
  };

  return (
    <AdminAppShell>
      <main className="db-main">
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
                    <td data-label="Quizzes" style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{nfmt(u.total_quizzes ?? 0)}</td>
                    <td data-label="Flashcards" style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{nfmt(u.total_flashcard_sets ?? 0)}</td>
                    <td data-label="Chats" style={{ textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{nfmt(u.total_chats ?? 0)}</td>
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
      </main>
    </AdminAppShell>
  );
}
