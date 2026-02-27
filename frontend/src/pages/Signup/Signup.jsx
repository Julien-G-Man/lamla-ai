import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

import '../Login/Login.css';
import './Signup.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BRAND_FEATURES = [
  { icon: '⚡', label: 'AI-powered quiz generation from any document' },
  { icon: '🃏', label: 'Smart flashcards with spaced repetition' },
  { icon: '📊', label: 'Progress analytics & performance insights' },
  { icon: '🤖', label: 'Personal AI tutor, available 24/7' },
];

const validate = (fields) => ({
  firstNameOk: fields.first_name.trim().length > 0,
  lastNameOk:  fields.last_name.trim().length > 0,
  emailOk:     EMAIL_RE.test(fields.email),
  lengthOk:    fields.password.length >= 8,
  matchOk:     fields.password !== '' && fields.password === fields.confirmPassword,
});

const Signup = () => {
  const [fields, setFields] = useState({
    first_name: '', last_name: '', email: '', password: '', confirmPassword: '',
  });
  const [showPw,        setShowPw]        = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState('');

  const navigate   = useNavigate();
  const { signup } = useAuth();

  const v         = validate(fields);
  const formValid = v.firstNameOk && v.lastNameOk && v.emailOk && v.lengthOk && v.matchOk;

  const progressStep =
    (v.firstNameOk && v.lastNameOk ? 1 : 0) +
    (v.emailOk ? 1 : 0) +
    (v.lengthOk && v.matchOk ? 1 : 0);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formValid) {
      setError('Please complete all fields correctly before continuing.');
      return;
    }
    setIsLoading(true);
    try {
      await signup(fields.email.trim(), fields.password, fields.first_name.trim(), fields.last_name.trim());
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.email?.[0]            ||
        err?.password?.[0]         ||
        err?.non_field_errors?.[0] ||
        err?.detail                ||
        err?.message               ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--signup">

      {/* ── Left: Brand panel ── */}
      <aside className="auth-brand-panel">
        <div className="brand-glow" aria-hidden="true" />

        <div className="auth-brand-logo">
          <img src="/assets/lamla_logo.png" alt="Lamla AI logo" />
          <span>Lamla AI</span>
        </div>

        <div className="auth-brand-headline">
          <h2>
            Start learning<br />
            <em>smarter today</em>.
          </h2>
          <p>
            Join thousands of students who use Lamla AI to ace their exams
            with personalised quizzes, flashcards, and an always-on AI tutor.
          </p>
        </div>

        <div className="auth-features">
          {BRAND_FEATURES.map(({ icon, label }) => (
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

          {/* Progress dots */}
          <div className="auth-progress" aria-label="Form completion progress">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`auth-progress-dot ${
                  progressStep > step
                    ? 'auth-progress-dot--done'
                    : progressStep === step
                    ? 'auth-progress-dot--active'
                    : ''
                }`}
              />
            ))}
          </div>

          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p>Join thousands of students studying smarter with Lamla AI.</p>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>

            <div className="auth-name-row">
              <div className="auth-field">
                <label htmlFor="signup-first-name">First name</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faUser} className="auth-input-icon" />
                  <input
                    id="signup-first-name"
                    name="first_name"
                    type="text"
                    placeholder="John"
                    value={fields.first_name}
                    onChange={handleChange}
                    autoComplete="given-name"
                    disabled={isLoading}
                    required
                  />
                  {v.firstNameOk && <FontAwesomeIcon icon={faCheckCircle} className="auth-input-check" />}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-last-name">Last name</label>
                <div className="auth-input-wrap">
                  <FontAwesomeIcon icon={faUser} className="auth-input-icon" />
                  <input
                    id="signup-last-name"
                    name="last_name"
                    type="text"
                    placeholder="Doe"
                    value={fields.last_name}
                    onChange={handleChange}
                    autoComplete="family-name"
                    disabled={isLoading}
                    required
                  />
                  {v.lastNameOk && <FontAwesomeIcon icon={faCheckCircle} className="auth-input-check" />}
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <div className="auth-input-wrap">
                <FontAwesomeIcon icon={faEnvelope} className="auth-input-icon" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={fields.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
                {v.emailOk && <FontAwesomeIcon icon={faCheckCircle} className="auth-input-check" />}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <div className="auth-input-wrap">
                <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                <input
                  id="signup-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={fields.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw((v) => !v)} disabled={isLoading} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} />
                </button>
              </div>
              <p className={`auth-hint ${v.lengthOk ? 'auth-hint--valid' : ''}`}>
                <span className="auth-hint-dot" /> At least 8 characters
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm-password">Confirm password</label>
              <div className="auth-input-wrap">
                <FontAwesomeIcon icon={faLock} className="auth-input-icon" />
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={fields.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirmPw((v) => !v)} disabled={isLoading} aria-label={showConfirmPw ? 'Hide password' : 'Show password'}>
                  <FontAwesomeIcon icon={showConfirmPw ? faEyeSlash : faEye} />
                </button>
              </div>
              <p className={`auth-hint ${v.matchOk ? 'auth-hint--valid' : ''}`}>
                <span className="auth-hint-dot" /> Passwords match
              </p>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={!formValid || isLoading}>
              {isLoading
                ? <><span className="auth-spinner" aria-hidden="true" /> Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>

          <footer className="auth-form-footer">
            <p>
              Already have an account?{' '}
              <Link to="/auth/login" className="auth-link">Sign in</Link>
            </p>
            <Link to="/" className="auth-link-muted">← Back to home</Link>
          </footer>

        </div>
      </main>
    </div>
  );
};

export default Signup;