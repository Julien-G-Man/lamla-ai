import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faSpinner, faEye, faEyeSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validations, setValidations] = useState({
    passwordLength: false,
    passwordMatch: false,
    emailValid: false,
    namesProvided: false,
  });

  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'password':
        setValidations(prev => ({
          ...prev,
          passwordLength: value.length >= 8,
          passwordMatch: value === formData.confirmPassword || formData.confirmPassword === '',
        }));
        break;
      case 'confirmPassword':
        setValidations(prev => ({
          ...prev,
          passwordMatch: value === formData.password,
        }));
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setValidations(prev => ({
          ...prev,
          emailValid: emailRegex.test(value),
        }));
        break;
      case 'first_name':
      case 'last_name':
        setValidations(prev => ({
          ...prev,
          namesProvided: formData.first_name.trim() !== '' && formData.last_name.trim() !== '',
        }));
        break;
      default:
        break;
    }
  };

  const isFormValid = () => {
    return (
      validations.passwordLength &&
      validations.passwordMatch &&
      validations.emailValid &&
      formData.first_name.trim() &&
      formData.last_name.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isFormValid()) {
        setError('Please fill in all fields correctly');
        setIsLoading(false);
        return;
      }

      await signup(
        formData.email,
        formData.password,
        formData.first_name,
        formData.last_name
      );

      // Redirect to user dashboard after signup
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || err.email?.[0] || 'Signup failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-header">
          <img src="/assets/lamla_logo.png" alt="Lamla AI" className="signup-logo" />
          <h1>Create Your Account</h1>
          <p>Join thousands of students studying smarter with Lamla AI</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          {/* Name Fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faUser} className="input-icon" />
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faUser} className="input-icon" />
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
              {validations.emailValid && (
                <FontAwesomeIcon icon={faCheckCircle} className="check-icon" />
              )}
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <div className="validation-hint">
              <small className={validations.passwordLength ? 'valid' : ''}>
                <span className="bullet">•</span> At least 8 characters
              </small>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            <div className="validation-hint">
              <small className={validations.passwordMatch ? 'valid' : ''}>
                <span className="bullet">•</span> Passwords match
              </small>
            </div>
          </div>

          <button 
            type="submit" 
            className="signup-btn" 
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <p>
            <Link to="/" className="back-home">← Back to Home</Link>
          </p>
        </div>

        <div className="signup-features">
          <p className="features-label">What you get:</p>
          <ul className="features-list">
            <li>AI-powered quiz generation</li>
            <li>Personalized flashcards</li>
            <li>Progress tracking</li>
            <li>AI tutor assistant</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
