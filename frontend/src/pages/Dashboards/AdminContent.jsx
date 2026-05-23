import React, { useEffect, useMemo, useState } from 'react';
import AdminAppShell from '../../components/AppShell/AdminAppShell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFileAlt, faUsers, faCog, faUser } from '@fortawesome/free-solid-svg-icons';
import RichTextRenderer from '../../utils/richTextRenderer';
import './AdminDashboard.css';

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

export default function AdminContent() {
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole } = useAuth();
  const [adminStats, setAdminStats] = useState({});
  const [anonymousUsage, setAnonymousUsage] = useState({ events: [], total_last_24h: 0 });
  const [anonymousWindowHours, setAnonymousWindowHours] = useState(24);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAnonymousUsage, setLoadingAnonymousUsage] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    if (getUserRole() !== 'admin') navigate('/dashboard');
  }, [isAuthenticated, getUserRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;

    dashboardService.getAdminStats()
      .then(setAdminStats)
      .catch(console.error)
      .finally(() => setLoadingStats(false));

    dashboardService.getAdminAnonymousUsage(200)
      .then(setAnonymousUsage)
      .catch(console.error)
      .finally(() => setLoadingAnonymousUsage(false));
  }, [isAuthenticated, getUserRole]);

  const anonymousTutorMessages = useMemo(() => {
    const events = Array.isArray(anonymousUsage?.events) ? anonymousUsage.events : [];
    const cutoffMs = Date.now() - (anonymousWindowHours * 60 * 60 * 1000);
    return events
      .filter((ev) => {
        if (!ev || !ev.tutor_message || !String(ev.tutor_message).trim()) return false;
        const createdAtMs = new Date(ev.created_at).getTime();
        if (Number.isNaN(createdAtMs)) return false;
        return createdAtMs >= cutoffMs;
      })
      .slice(0, 40);
  }, [anonymousUsage, anonymousWindowHours]);

  const anonymousWindowOptions = [1, 2, 5, 12, 24];

  return (
    <AdminAppShell>
      <main className="db-main">
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

        <div className="db-card">
          <h2>Unauthenticated Usage (Last 24h)</h2>
          <div className="db-stats-grid">
            <div className="db-stat-card"><div className="db-stat-body"><p>Quiz Requests</p><h3>{nfmt(adminStats.unauthenticated_usage_24h?.quiz_requests)}</h3></div></div>
            <div className="db-stat-card"><div className="db-stat-body"><p>Chat Requests</p><h3>{nfmt(adminStats.unauthenticated_usage_24h?.chat_requests)}</h3></div></div>
            <div className="db-stat-card"><div className="db-stat-body"><p>Flashcard Requests</p><h3>{nfmt(adminStats.unauthenticated_usage_24h?.flashcard_requests)}</h3></div></div>
            <div className="db-stat-card"><div className="db-stat-body"><p>Token Burn (Est.)</p><h3>{nfmt(adminStats.unauthenticated_usage_24h?.estimated_tokens)}</h3></div></div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 10 }}>
            Rolling 24-hour anonymous API-only window.
          </p>
        </div>

        <div className="db-card">
          <div className="db-card-header" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Anonymous Tutor Messages (Last {anonymousWindowHours}h)</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {anonymousWindowOptions.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  className={`db-btn db-btn-sm ${anonymousWindowHours === hours ? 'db-btn-primary' : 'db-btn-ghost'}`}
                  onClick={() => setAnonymousWindowHours(hours)}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>
          {loadingAnonymousUsage ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading anonymous messages...</p>
          ) : anonymousTutorMessages.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No anonymous tutor messages captured in the last {anonymousWindowHours} hours.</p>
          ) : (
            <div className="db-ratings-list">
              {anonymousTutorMessages.map((item, idx) => (
                <div className="db-rating-item" key={`${item.id || idx}-${item.created_at || idx}`}>
                  <div style={{ width: '100%' }}>
                    <p className="db-rating-actor">{item.session_key ? `Session ${String(item.session_key).slice(-8)}` : 'Anonymous session'}</p>
                    <span className="db-rating-time">{formatRelativeTime(item.created_at)} • {item.path}</span>
                    <p style={{ marginTop: 6, marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>User message</p>
                    <p style={{ marginTop: 0, marginBottom: 8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{item.tutor_message}</p>
                    <p style={{ marginTop: 0, marginBottom: 4, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Tutor response</p>
                    {item.tutor_response ? (
                      <RichTextRenderer text={item.tutor_response} className="db-anon-response-richtext" />
                    ) : (
                      <p style={{ marginTop: 0, marginBottom: 0, color: 'var(--text-secondary)' }}>No response captured</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AdminAppShell>
  );
}
