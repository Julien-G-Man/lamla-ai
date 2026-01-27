import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../App.css"; 

const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="main-header">
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
            <li><Link to="/about">About</Link></li>
            <li><Link to="/ai-tutor">AI Tutor</Link></li>
            <li><Link to="/custom-quiz">Quiz</Link></li>
            <li><Link to="#/flashcards">Flashcards</Link></li>
            {user ? (
              <li className="nav-item-cta">
                <Link to="#/dashboard" className="btn btn-nav-secondary">Dashboard</Link>
              </li>
            ) : (
              <li className="nav-item-cta">
                <Link to="#/account/signup" className="btn btn-nav-secondary">Sign Up</Link>
              </li>
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
