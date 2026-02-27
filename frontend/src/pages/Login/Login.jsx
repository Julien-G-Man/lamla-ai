import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import './Login.css';

// ── Brand-panel feature list ──────────────────────────────────────────────────
const FEATURES = [
  { icon: '⚡', label: 'AI-powered quiz generation from any document' },
  { icon: '🃏', label: 'Smart flashcards with spaced repetition' },
  { icon: '📊', label: 'Progress analytics & performance insights' },
  { icon: '🤖', label: 'Personal AI tutor, available 24/7' },
];

// ── Component ─────────────────────────────────────────────────────────────────
const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(email.trim(), password);
      const isAdmin  = response?.user?.is_admin;
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard');
    } catch (err) {
      // Normalise error message from various server response shapes
      const msg =
        err?.non_field_errors?.[0] ||
        err?.detail ||
        err?.message ||
        'Incorrect email or password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left: Brand panel ── */}
      <aside className="auth-brand-panel">
        <div className="brand-glow" aria-hidden="true" />

        <div className="auth-brand-logo">
          <img src="/assets/lamla_logo.png" alt="Lamla AI logo" />
          <span>Lamla AI</span>
        </div>

        <div className="auth-brand-headline">
          <h2>
            Study smarter,<br />
            not <em>harder</em>.
          </h2>
          <p>
            Join thousands of students who use Lamla AI to ace their exams
            with personalised quizzes, flashcards, and an always-on AI tutor.
          </p>
        </div>

        <div className="auth-features">
          {FEATURES.map(({ icon, label }) => (
            <div className="auth-feature-item" key={label}>
              <div className="auth-feature-icon" aria-hidden="true">{icon}</div>
              <span className="auth-feature-text">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right: Form panel ── */}
      <main className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to continue your study journey.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <FontAwesomeIcon icon={faEnvelope} className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <footer className="auth-form-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/auth/signup" className="auth-link">
                Create one free
              </Link>
            </p>
            <Link to="/" className="auth-link-muted">
              ← Back to home
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Login;