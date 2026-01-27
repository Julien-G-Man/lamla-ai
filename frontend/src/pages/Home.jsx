import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";
import "../App.css";

const Home = ({ user }) => {
  return (
    <div className="site-wrapper"> {/* Required for Sticky Footer logic */}
      <Navbar user={user} />
      
      <main className="main-content"> {/* main-content pushes the footer */}
        
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">🚀</span>
              <span>AI-Powered Learning Platform</span>
            </div>

            <h1 className="hero-title">
                <span className="title-line">Level Up Your Exam Game with</span>
                <span className="brand-highlight">Lamla AI</span>
            </h1>

            <p className="hero-desc">
                Lamla AI is a smart exam preparation assistant designed to help you study with intention, not panic. 
                Upload your study materials and transform them into interactive quizzes and flashcards.
                <br /><strong className="highlight-text">Study smarter. Perform better.</strong>
            </p>

            <div className="hero-stats">
                <div className="stat-item">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Students</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">250+</span>
                    <span className="stat-label">Quizzes Generated</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">92%</span>
                    <span className="stat-label">Success Rate</span>
                </div>
            </div>

            <div className="hero-btns">
              {!user ? (
                <a href="#/account/signup" className="hero-btn primary">Get Started Free</a>
              ) : (
                <a href="/custom-quiz" className="hero-btn primary">Start Practicing</a>
              )}
              <a href="#features" className="hero-btn secondary">Explore Features</a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
            <div className="container">
                <div className="section-header">
                    <div className="section-badge"><span>✨ Features</span></div>
                    <h2>Smart Features for <span className="brand-highlight"> Smart Students</span></h2>
                </div>
            
                <div className="features-grid">
                    {/* 1. Quiz Mode */}
                    <a href="/custom-quiz" className="feature-card">
                        <div className="feature-icon"><span className="icon-emoji">🧠</span><div className="icon-bg"></div></div>
                        <h3 className="feature-title">Quiz Mode</h3>
                        <p className="feature-desc">Automatically generates multiple-choice questions from your materials.</p>
                    </a>
                
                    {/* 2. AI Tutor */}
                    <a href="/ai-tutor" className="feature-card">
                        <div className="feature-icon"><span className="icon-emoji">🤖</span><div className="icon-bg"></div></div>
                        <h3 className="feature-title">AI Tutor</h3>
                        <p className="feature-desc">Get instant answers to your questions and deeper explanations.</p>
                    </a>

                    {/* 3. Flashcards */}
                    <a href="#/flashcards" className="feature-card">
                        <div className="feature-icon"><span className="icon-emoji">🃏</span><div className="icon-bg"></div></div>
                        <h3 className="feature-title">Interactive Flashcards</h3>
                        <p className="feature-desc">Create and study with AI-generated flashcards for quick review.</p>
                    </a>

                    {/* 4. Exam Analyzer */}
                    <a href="#/exam-analyzer" className="feature-card">
                        <div className="feature-icon"><span className="icon-emoji">🔍</span><div className="icon-bg"></div></div>
                        <h3 className="feature-title">Exam Pattern Analysis</h3>
                        <p className="feature-desc">Analyze uploaded exams or slides for instant feedback and topic breakdowns.</p>
                    </a>                

                    {/* 5. Performance Analytics */}
                    <a href="#/dashboard" className="feature-card">
                        <div className="feature-icon"><span className="icon-emoji">📊</span><div className="icon-bg"></div></div>
                        <h3 className="feature-title">Performance Analytics</h3>
                        <p className="feature-desc">Track your progress and identify weak points to focus your efforts.</p>
                    </a>

                    {/* 6. Subject Selection */}
                    <a href="/custom-quiz" className="feature-card">
                        <div className="feature-icon"><span className="icon-emoji">📚</span><div className="icon-bg"></div></div>
                        <h3 className="feature-title">Subject Selection</h3>
                        <p className="feature-desc">Select your subject or topic before quiz generation for targeted study.</p>
                    </a>                 
                </div>
            </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section">
            <div className="container">
                <div className="section-header">
                    <h2>What Our Students <span className="highlight">Have To Say</span></h2>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <blockquote className="testimonial-quote">
                            "Lamla AI helped me turn my lecture slides into practice quizzes in seconds. It's an amazing tool!"
                        </blockquote> 
                        <div className="testimonial-author">
                            <div className="author-avatar"><span>CN</span></div>
                            <div className="author-info">
                                <p className="author-name">Christopher N</p>
                                <p className="author-title">Student @ KNUST</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Home;