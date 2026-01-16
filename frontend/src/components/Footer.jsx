import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container footer-grid">
        <div className="footer-col footer-about">
          <h3>Contact Us</h3>
          <ul>
            <li>
              <a href="mailto:lamlaaiteam@gmail.com"><i className="fas fa-envelope"></i> lamlaaiteam@gmail.com</a>
            </li>
            <li>
              <a href="tel:+233509341251"><i className="fas fa-phone"></i> +233 50 934 1251</a>
            </li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/ai-tutor">AI Tutor</Link></li>
            <li><Link to="/custom-quiz">Quiz</Link></li>
            <li><Link to="/flashcards">Flashcards</Link></li>
            <li><Link to="/exam-analyzer">Exam Analyzer</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>Connect With Us</h3>
          <div className="social-icons">
            <a href="https://www.instagram.com/lamla.io" className="social-icon" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="https://www.linkedin.com/company/lamla-ai" className="social-icon" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            <a href="https://www.facebook.com/people/LamlaAI/61578006032583/" className="social-icon" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="https://x.com/lamla.ai" className="social-icon"><i className="fab fa-twitter" aria-label="X/Tweeter"></i></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 Lamla AI. All rights reserved.</p>
        <div className="legal-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
