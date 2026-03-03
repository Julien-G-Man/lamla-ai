import React, { useState, useEffect } from "react";
import { Link, useLocation,} from "react-router-dom"; // useNavigate  ifnavigate gets uncommented
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const Navbar = ({ user }) => {
  const location       = useLocation();
  // const navigate       = useNavigate();
  const isHome         = location.pathname === "/";

  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated }    = useAuth();
  const [isOpen, setIsOpen]    = useState(false);

  // On non-home pages we never want transparent — start as true and skip listener
  const [isScrolled, setIsScrolled] = useState(!isHome || window.scrollY > 50);

  // Re-evaluate whenever the route changes
  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }

    // We're on home — sync immediately in case we arrived mid-scroll
    setIsScrolled(window.scrollY > 50);

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  /**
   * Logo / "Home" click:
   * - Already on /  → smooth scroll to very top (hero)
   * - On other page → navigate to / (browser starts at top naturally)
   */
  const handleHomeClick = (e) => {
    closeMenu();
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // else: let <Link to="/"> do its default navigation
  };

  return (
    <>
      {/* ── Navbar ── */}
      <header className={`main-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container header-container">

          {/* Logo */}
          <Link to="/" className="logo" onClick={handleHomeClick}>
            <img src="/assets/lamla_logo.png" alt="Lamla AI Logo" className="logo-img" />
            <span className="brand-highlight">Lamla.ai</span>
          </Link>

          {/* Desktop nav */}
          <nav className="main-nav">
            <ul className="nav-links nav-links--desktop">
              <li>
                <Link to="/" onClick={handleHomeClick}>Home</Link>
              </li>
              <li><Link to="/ai-tutor">AI Tutor</Link></li>
              <li><Link to="/quiz/create">Quiz</Link></li>
              <li><Link to="/flashcards">Flashcards</Link></li>
              {isAuthenticated || user ? (
                <li className="nav-item-cta">
                  <Link to="/dashboard" className="btn btn-nav-secondary">Dashboard</Link>
                </li>
              ) : (
                <>
                  <li className="nav-item-cta">
                    <Link to="/auth/signup" className="btn btn-nav-secondary">Sign Up</Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Hamburger */}
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

      {/* ── Mobile overlay ── */}
      <div
        className={`nav-overlay ${isOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* ── Mobile drawer ── */}
      <ul className={`nav-links nav-links--mobile ${isOpen ? "open" : ""}`}>
        <li>
          <Link to="/" onClick={handleHomeClick}>Home</Link>
        </li>
        <li><Link to="/ai-tutor" onClick={closeMenu}>AI Tutor</Link></li>
        <li><Link to="/quiz/create" onClick={closeMenu}>Quiz</Link></li>
        <li><Link to="/flashcards" onClick={closeMenu}>Flashcards</Link></li>
        {isAuthenticated || user ? (
          <li className="nav-item-cta">
            <Link to="/dashboard" className="btn btn-nav-secondary" onClick={closeMenu}>Dashboard</Link>
          </li>
        ) : (
          <>
            <li><Link to="/auth/login" onClick={closeMenu}>Login</Link></li>
            <li className="nav-item-cta">
              <Link to="/auth/signup" className="btn btn-nav-secondary" onClick={closeMenu}>Sign Up</Link>
            </li>
          </>
        )}
      </ul>

      {/* ── Theme FAB ── */}
      <button
        className="theme-toggle-fab"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark"
          ? <i className="fas fa-sun"></i>
          : <i className="fas fa-moon"></i>}
      </button>
    </>
  );
};

export default Navbar;