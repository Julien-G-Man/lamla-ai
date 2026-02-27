import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  // Scroll listener — show glassy navbar after 50px
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* ── Navbar ── */}
      <header className={`main-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container header-container">

          {/* Logo */}
          <Link to="/" className="logo" onClick={closeMenu}>
            <img src="/assets/lamla_logo.png" alt="Lamla AI Logo" className="logo-img" />
            <span className="brand-highlight">Lamla.ai</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="main-nav">
            <ul className="nav-links nav-links--desktop">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/ai-tutor">AI Tutor</Link></li>
              <li><Link to="/custom-quiz">Quiz</Link></li>
              <li><Link to="/flashcards">Flashcards</Link></li>
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

          {/* Hamburger — mobile only */}
          <button
            className={`navbar-hamburger ${isOpen ? "open" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>
      </header>

      {/* ── Mobile slide-out panel ── */}
      {/* Overlay */}
      <div
        className={`nav-overlay ${isOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer */}
      <ul className={`nav-links nav-links--mobile ${isOpen ? "open" : ""}`}>
        <li><Link to="/" onClick={closeMenu}>Home</Link></li>
        <li><Link to="/ai-tutor" onClick={closeMenu}>AI Tutor</Link></li>
        <li><Link to="/custom-quiz" onClick={closeMenu}>Quiz</Link></li>
        <li><Link to="/flashcards" onClick={closeMenu}>Flashcards</Link></li>
        {isAuthenticated || user ? (
          <li className="nav-item-cta">
            <Link to="/dashboard" className="btn btn-nav-secondary" onClick={closeMenu}>Dashboard</Link>
          </li>
        ) : (
          <>
            <li><Link to="/login" onClick={closeMenu}>Login</Link></li>
            <li className="nav-item-cta">
              <Link to="/signup" className="btn btn-nav-secondary" onClick={closeMenu}>Sign Up</Link>
            </li>
          </>
        )}
      </ul>

      {/* ── Theme toggle FAB — fixed bottom-right ── */}
      <button
        className="theme-toggle-fab"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <i className="fas fa-sun"></i>
        ) : (
          <i className="fas fa-moon"></i>
        )}
      </button>
    </>
  );
};

export default Navbar;