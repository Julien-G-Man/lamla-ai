import React, { useEffect, useState } from 'react';
import AdminAppShell from '../../components/AppShell/AdminAppShell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

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
      <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const { isAuthenticated, getUserRole } = useAuth();
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
  }, [isAuthenticated, getUserRole, navigate]);

  useEffect(() => {
    if (!isAuthenticated || getUserRole() !== 'admin') return;
    if (!systemSettings && !loadingSettings) {
      setLoadingSettings(true);
      dashboardService.getSystemSettings()
        .then(setSystemSettings)
        .catch((err) => {
          console.error('Failed to load settings:', err);
          setSettingsMessage({ ok: '', err: 'Failed to load settings' });
        })
        .finally(() => setLoadingSettings(false));
    }
  }, [isAuthenticated, getUserRole, systemSettings, loadingSettings]);

  return (
    <AdminAppShell>
      <main className="db-main">
        <div className="db-page-header">
          <h1>System Settings</h1>
          <p>Configure platform parameters and feature toggles.</p>
        </div>

        <SettingsTab
          settings={systemSettings}
          loading={loadingSettings}
          saving={savingSettings}
          message={settingsMessage}
          onSettingsChange={setSystemSettings}
          onMessageChange={setSettingsMessage}
          onSavingChange={setSavingSettings}
        />
      </main>
    </AdminAppShell>
  );
}
