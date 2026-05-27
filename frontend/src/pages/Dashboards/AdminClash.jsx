import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAppShell from '../../components/AppShell/AdminAppShell';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL;

const STATUS_BADGE = {
  waiting:  'db-badge-gray',
  active:   'db-badge-blue',
  finished: 'db-badge-green',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium', timeStyle: 'short',
  });
}

export default function AdminClash() {
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole } = useAuth();
  const token = localStorage.getItem('auth_token');

  const [clashes, setClashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (getUserRole() !== 'admin') { navigate('/dashboard'); return; }
  }, [isAuthenticated, getUserRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    fetch(`${DJANGO_API_URL}/clash/admin/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => r.json())
      .then(data => setClashes(data.clashes || []))
      .catch(() => setError('Failed to load clash data.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, getUserRole, token]);

  return (
    <AdminAppShell>
      <main className="db-main">
        <div className="db-page-header">
          <h1>Clashes</h1>
          <p>All multiplayer quiz sessions — past and present.</p>
        </div>

        {loading ? (
          <div className="db-card">
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
              <p>Loading clashes…</p>
            </div>
          </div>
        ) : error ? (
          <div className="db-card">
            <p style={{ color: 'var(--color-error)', textAlign: 'center', padding: '24px' }}>{error}</p>
          </div>
        ) : clashes.length === 0 ? (
          <div className="db-card">
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '48px 24px' }}>
              No clashes yet.
            </p>
          </div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Difficulty</th>
                  <th>Questions</th>
                  <th>Players</th>
                  <th>Winner</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clashes.map(c => (
                  <tr
                    key={c.room_code}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin-dashboard/clashes/${c.room_code}`)}
                  >
                    <td data-label="Code">
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
                        {c.room_code}
                      </span>
                    </td>
                    <td data-label="Subject" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {c.subject}
                    </td>
                    <td data-label="Difficulty" style={{ textTransform: 'capitalize' }}>{c.difficulty}</td>
                    <td data-label="Questions" style={{ textAlign: 'center' }}>{c.num_questions}</td>
                    <td data-label="Players" style={{ textAlign: 'center' }}>{c.participant_count}</td>
                    <td data-label="Winner">
                      {c.winner
                        ? <span>{c.winner.display_name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em' }}>({c.winner.score} pts)</span></span>
                        : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td data-label="Status">
                      <span className={`db-badge ${STATUS_BADGE[c.status] || 'db-badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                        {c.status}
                      </span>
                    </td>
                    <td data-label="Created">{fmt(c.created_at)}</td>
                    <td>
                      <button
                        className="db-btn db-btn-ghost db-btn-sm"
                        onClick={e => { e.stopPropagation(); navigate(`/admin-dashboard/clashes/${c.room_code}`); }}
                      >
                        View
                      </button>
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
