import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../App.css";

const Navbar = ({ user, brandOnly = false }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(!isHome || window.scrollY > 50);

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }

    setIsScrolled(window.scrollY > 50);

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    if (brandOnly) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, brandOnly]);

  const closeMenu = () => setIsOpen(false);

  const handleHomeClick = (e) => {
    closeMenu();
    if (isHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header className={`main-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="container header-container">
          <Link to="/" className="logo" onClick={handleHomeClick}>
            <img src="/assets/lamla_logo.png" alt="Lamla AI Logo" className="logo-img" />
            <span className="brand-highlight">Lamla.ai</span>
          </Link>

          {!brandOnly && (
            <>
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
                    <li className="nav-item-cta">
                      <Link to="/auth/login" className="btn btn-nav-secondary">Login</Link>
                    </li>
                  )}
                </ul>
              </nav>

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
            </>
          )}
        </div>
      </header>

      {!brandOnly && (
        <>
          <div className={`nav-overlay ${isOpen ? "open" : ""}`} onClick={closeMenu} aria-hidden="true" />

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
        </>
      )}
    </>
  );
};

export default Navbar;
