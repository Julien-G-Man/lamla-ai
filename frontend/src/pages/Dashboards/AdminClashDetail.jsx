import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function medalStyle(rank) {
  if (rank === 1) return { color: '#f5c400', fontWeight: 700 };
  if (rank === 2) return { color: '#9aa0b0', fontWeight: 700 };
  if (rank === 3) return { color: '#cd7f32', fontWeight: 700 };
  return {};
}

export default function AdminClashDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole } = useAuth();
  const token = localStorage.getItem('auth_token');

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (getUserRole() !== 'admin') { navigate('/dashboard'); return; }
  }, [isAuthenticated, getUserRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    fetch(`${DJANGO_API_URL}/clash/admin/${code}/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setRoom)
      .catch(() => setError('Failed to load clash details.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, getUserRole, token, code]);

  return (
    <AdminAppShell>
      <main className="db-main">
        <div className="db-page-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => navigate('/admin-dashboard/clashes')}>
            ← Back
          </button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              Clash{' '}
              <span style={{ fontFamily: 'monospace', fontSize: '1.1em', letterSpacing: '0.08em' }}>
                {code}
              </span>
              {room && (
                <span className={`db-badge ${STATUS_BADGE[room.status] || 'db-badge-gray'}`} style={{ textTransform: 'capitalize', fontSize: '0.7em' }}>
                  {room.status}
                </span>
              )}
            </h1>
            {room && <p>{room.subject}</p>}
          </div>
        </div>

        {loading ? (
          <div className="db-card">
            <p style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>Loading…</p>
          </div>
        ) : error ? (
          <div className="db-card">
            <p style={{ color: 'var(--color-error)', textAlign: 'center', padding: '24px' }}>{error}</p>
          </div>
        ) : room && (
          <>
            {/* Meta stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Host', value: room.host_username },
                { label: 'Difficulty', value: room.difficulty, caps: true },
                { label: 'Questions', value: room.num_questions },
                { label: 'Time / Q', value: `${room.time_per_question}s` },
                { label: 'Players', value: room.participants.length },
                { label: 'Created', value: fmt(room.created_at) },
                { label: 'Started', value: fmt(room.started_at) },
                { label: 'Finished', value: fmt(room.finished_at) },
              ].map(({ label, value, caps }) => (
                <div key={label} className="db-card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.75em', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: caps ? 'capitalize' : undefined }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ margin: 0, fontSize: '1.05em' }}>Leaderboard</h2>
              </div>
              {room.participants.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No participants.</p>
              ) : (
                <div className="db-table-wrap">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Rank</th>
                        <th>Player</th>
                        <th style={{ textAlign: 'center' }}>Score</th>
                        <th style={{ textAlign: 'center' }}>Correct</th>
                        <th style={{ textAlign: 'center' }}>Accuracy</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.participants.map((p, i) => {
                        const accuracy = room.num_questions > 0
                          ? Math.round((p.correct / room.num_questions) * 100)
                          : 0;
                        const displayRank = p.rank ?? i + 1;
                        return (
                          <tr key={p.username}>
                            <td data-label="Rank">
                              <span style={{ fontSize: '1.1em', ...medalStyle(displayRank) }}>
                                {displayRank === 1 ? '🥇' : displayRank === 2 ? '🥈' : displayRank === 3 ? '🥉' : `#${displayRank}`}
                              </span>
                            </td>
                            <td data-label="Player">
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.display_name}</span>
                              {p.display_name !== p.username && (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85em', marginLeft: '6px' }}>@{p.username}</span>
                              )}
                            </td>
                            <td data-label="Score" style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {p.score.toLocaleString()}
                            </td>
                            <td data-label="Correct" style={{ textAlign: 'center' }}>
                              {p.correct} / {room.num_questions}
                            </td>
                            <td data-label="Accuracy" style={{ textAlign: 'center' }}>
                              <span className={`db-badge ${accuracy >= 70 ? 'db-badge-green' : accuracy >= 40 ? 'db-badge-blue' : 'db-badge-gray'}`}>
                                {accuracy}%
                              </span>
                            </td>
                            <td data-label="Role">
                              {p.is_host
                                ? <span className="db-badge db-badge-blue">Host</span>
                                : <span style={{ color: 'var(--text-secondary)' }}>Player</span>}
                            </td>
                            <td data-label="Joined">{fmt(p.joined_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </AdminAppShell>
  );
}
