import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import "../App.css"; 

const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user: authUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`main-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container header-container">
        <Link to="/" className="logo">
          <img src="/assets/lamla_logo.png" alt="Lamla AI Logo" className="logo-img" />
          <span className="brand-highlight">Lamla.ai</span>
        </Link>

        <nav className="main-nav">
          <div className="navbar-hamburger" id="hamburgerBtn" onClick={() => setIsOpen(!isOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <ul className={`nav-links ${isOpen ? "open" : ""}`}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/ai-tutor">AI Tutor</Link></li>
            <li><Link to="/custom-quiz">Quiz</Link></li>
            <li><Link to="#/flashcards">Flashcards</Link></li>
            <li className="theme-toggle-wrapper">
              <button 
                className="theme-toggle-btn" 
                onClick={toggleTheme}
                aria-label="toggle theme"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <i className="fas fa-sun"></i>
                ) : (
                  <i className="fas fa-moon"></i>
                )}
              </button>
            </li>
            {isAuthenticated || user ? (
              <li className="nav-item-cta">
                <Link to="/dashboard" className="btn btn-nav-secondary">Dashboard</Link>
              </li>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li className="nav-item-cta">
                  <Link to="/signup" className="btn btn-nav-secondary">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <button className="nav-toggle" id="nav-toggle" aria-label="toggle navigation">
            <i className="fas fa-bars"></i>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
