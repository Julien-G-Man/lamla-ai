import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";

const Home = ({ user }) => {
  return (
    <>
      <Navbar user={user} />
      <main className="home-page">
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
                Upload your study materials and transform them into interactive quizzes and flashcards, get instant 
                feedback and performance insights with AI-powered learning tools.<br></br><strong className="highlight-text">Study smarter. Perform better.</strong>
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
                <a href="/account/signup" className="hero-btn primary">Get Started Free</a>
              ) : (
                <a href="/custom-quiz" className="hero-btn primary">Start Practicing</a>
              )}
              <a href="#features" className="hero-btn secondary">Explore Features</a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features-section">
            <div className="section-bg">
                <div className="bg-pattern"></div>
            </div>
            
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <div className="section-badge">
                        <span>✨ Features</span>
                    </div>
                    <h2>Smart Features for <span className="brand-highlight"> Smart Students</span></h2>
                    <p>Lamla AI helps you prepare with purpose using these core features:</p>
                </div>
            
                <div className="features-grid">
                    <a href="/custom-quiz" className="feature-card" data-aos="fade-up" data-aos-delay="200">
                        <div className="card-glow"></div>
                        <div className="feature-icon">
                            <span className="icon-emoji">🧠</span>
                            <div className="icon-bg"></div>
                        </div>
                        <h3 className="feature-title">Quiz Mode</h3>
                        <p className="feature-desc">Automatically generates multiple-choice questions from your materials or typed content. Get instant feedback on your responses.</p>
                        <div className="feature-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                        </div>
                    </a>
                
                    <a href="/ai-tutor" className="feature-card" data-aos="fade-up" data-aos-delay="400">
                        <div className="card-glow"></div>
                        <div className="feature-icon">
                            <span className="icon-emoji">🤖</span>
                            <div className="icon-bg"></div>
                        </div>
                        <h3 className="feature-title">AI Tutor</h3>
                        <p className="feature-desc">Get instant answers to your questions and deeper explanations of complex topics.</p>
                        <div className="feature-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                        </div>
                    </a>

                    <a href="/flashcards" className="feature-card" data-aos="fade-up" data-aos-delay="100">
                        <div className="card-glow"></div>
                        <div className="feature-icon">
                            <span className="icon-emoji">🃏</span>
                            <div className="icon-bg"></div>
                        </div>
                        <h3 className="feature-title">Interactive Flashcards </h3>
                        <p className="feature-desc">Create and study with AI-generated flashcards. Perfect for memorization and quick review sessions.</p>
                        <div className="feature-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                        </div>
                    </a>

                    <a href="exam_analyzer" className="feature-card" data-aos="fade-up" data-aos-delay="100">
                        <div className="card-glow"></div>
                        <div className="feature-icon">
                            <span className="icon-emoji">🔍</span>
                            <div className="icon-bg"></div>
                        </div>
                        <h3 className="feature-title">Exam Pattern Analysis</h3>
                        <p className="feature-desc">Analyze your uploaded exams or quizzes and slides for instant feedback, topic breakdown, and personalized study recommendations.</p>
                        <div className="feature-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                        </div>
                    </a>                

                    <a href="#/dashboard/recent-activity" className="feature-card" data-aos="fade-up" data-aos-delay="300">
                        <div className="card-glow"></div>
                        <div className="feature-icon">
                            <span className="icon-emoji">📊</span>
                            <div className="icon-bg"></div>
                        </div>
                        <h3 className="feature-title">Performance Analytics</h3>
                        <p className="feature-desc">Track your progress and identify your weak points to focus your study efforts effectively.</p>
                        <div className="feature-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                        </div>
                    </a>

                    <a href="#custom_quiz" className="feature-card" data-aos="fade-up" data-aos-delay="100">
                        <div className="card-glow"></div>
                        <div className="feature-icon">
                            <span className="icon-emoji">📚</span>
                            <div className="icon-bg"></div>
                        </div>
                        <h3 className="feature-title">Subject + Topic Selection</h3>
                        <p className="feature-desc">Select your subject or topic before quiz generation. Early foundation for syllabus-aware functionality.</p>
                        <div className="feature-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                            </svg>
                        </div>
                    </a>                 
                </div>
            </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <div className="section-badge">
                        <span>🌟 Testimonials</span>
                    </div>               
                    <h2>What Our Students <span className="highlight">Have To Say</span></h2>
                    <p>Don't just take our word for it—see what students like you have to say.</p>               
                </div>
                <div className="testimonial-rating">
                    <div className="stars">
                        <span className="star">⭐⭐⭐⭐⭐</span>
                    </div>
                    <div>
                        <span className="rating-text">4.9/5 from 50+ students</span>
                    </div>
                </div>           
            
                <div className="testimonials-grid">
                    <div className="testimonial-card" data-aos="fade-up" data-aos-delay="100">
                        <blockquote className="testimonial-quote">
                            "Lamla AI helped me turn my lecture slides into practice quizzes and flashcards in seconds. 
                            It's an amazing tool for exam preparation and has saved me countless hours searching for past questions!"
                        </blockquote> 
                        <div className="testimonial-author">
                            <div className="author-avatar">
                                <span>CN</span>
                            </div>
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
    </>
  );
};

export default Home;
