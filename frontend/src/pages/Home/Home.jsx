import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "./Home.css";
import "../../App.css";

const Home = ({ user }) => {
  const [isVisible, setIsVisible] = useState({
    features: false,
    testimonials: false,
    principles: false
  });

  useEffect(() => {
    const observers = {};
    
    // Lazy load features section
    const featuresObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(prev => ({ ...prev, features: true }));
        featuresObserver.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    const featuresEl = document.getElementById("features");
    if (featuresEl) {
      featuresObserver.observe(featuresEl);
      observers.features = featuresObserver;
    }

    // Lazy load testimonials section
    const testimonialsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(prev => ({ ...prev, testimonials: true }));
        testimonialsObserver.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    const testimonialsEl = document.getElementById("testimonials");
    if (testimonialsEl) {
      testimonialsObserver.observe(testimonialsEl);
      observers.testimonials = testimonialsObserver;
    }

    // Lazy load principles section
    const principlesObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(prev => ({ ...prev, principles: true }));
        principlesObserver.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    const principlesEl = document.getElementById("principles");
    if (principlesEl) {
      principlesObserver.observe(principlesEl);
      observers.principles = principlesObserver;
    }

    return () => {
      if (observers.features) observers.features.disconnect();
      if (observers.testimonials) observers.testimonials.disconnect();
      if (observers.principles) observers.principles.disconnect();
    };
  }, []);

  return (
    <div className="site-wrapper">
      <Navbar user={user} />
      
      <main className="main-content">
        
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
            
                {isVisible.features && (
                  <div className="features-grid">
                    {/* 1. Quiz Mode */}
                    <a href="/custom-quiz" className="feature-card">
                        <div className="feature-image">
                            <img src="/assets/quizzes.jpg" alt="Quiz Mode" />
                        </div>
                        <div className="feature-card-content">
                            <h3 className="feature-title">Quiz Mode</h3>
                            <p className="feature-desc">Automatically generates multiple-choice questions from your materials.</p>
                            <span className="feature-link">Explore Feature →</span>
                        </div>
                    </a>
                
                    {/* 2. AI Tutor */}
                    <a href="/ai-tutor" className="feature-card">
                        <div className="feature-image">
                            <img src="/assets/ai-tutor.jpg" alt="AI Tutor" />
                        </div>
                        <div className="feature-card-content">
                            <h3 className="feature-title">AI Tutor</h3>
                            <p className="feature-desc">Get instant answers to your questions and deeper explanations.</p>
                            <span className="feature-link">Explore Feature →</span>
                        </div>
                    </a>

                    {/* 3. Flashcards */}
                    <a href="#/flashcards" className="feature-card">
                        <div className="feature-image">
                            <img src="/assets/flashcards.jpeg" alt="Flashcards" />
                        </div>
                        <div className="feature-card-content">
                            <h3 className="feature-title">Interactive Flashcards</h3>
                            <p className="feature-desc">Create and study with AI-generated flashcards for quick review.</p>
                            <span className="feature-link">Explore Feature →</span>
                        </div>
                    </a>

                    {/* 4. Exam Analyzer */}
                    <a href="#/exam-analyzer" className="feature-card">
                        <div className="feature-image">
                            <img src="/assets/uni_exams.jpg" alt="Exam Analyzer" />
                        </div>
                        <div className="feature-card-content">
                            <h3 className="feature-title">Exam Pattern Analysis</h3>
                            <p className="feature-desc">Analyze uploaded exams or slides for instant feedback and topic breakdowns.</p>
                            <span className="feature-link">Explore Feature →</span>
                        </div>
                    </a>                

                    {/* 5. Performance Analytics */}
                    <a href="#/dashboard" className="feature-card">
                        <div className="feature-image">
                            <img src="/assets/improve-performance.jpg" alt="Performance Analytics" />
                        </div>
                        <div className="feature-card-content">
                            <h3 className="feature-title">Performance Analytics</h3>
                            <p className="feature-desc">Track your progress and identify weak points to focus your efforts.</p>
                            <span className="feature-link">Explore Feature →</span>
                        </div>
                    </a>

                    {/* 6. Subject Selection */}
                    <a href="/custom-quiz" className="feature-card">
                        <div className="feature-image">
                            <img src="/assets/steam.jpg" alt="Subject Selection" />
                        </div>
                        <div className="feature-card-content">
                            <h3 className="feature-title">Subject Selection</h3>
                            <p className="feature-desc">Select your subject or topic before quiz generation for targeted study.</p>
                            <span className="feature-link">Explore Feature →</span>
                        </div>
                    </a>                 
                  </div>
                )}
            </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="testimonials-section">
            <div className="container">
                <div className="section-header">
                    <h2>What Our Students <span className="highlight">Have To Say</span></h2>
                </div>
                {isVisible.testimonials && (
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
                )}
            </div>
        </section>

        {/* About/Principles Section */}
        <section id="principles" className="principles-section">
            <div className="container">
                <div className="section-header principles-header">
                    <h2>About <span className="brand-highlight">Lamla AI</span></h2>
                    <p className="section-intro">
                        A smart exam preparation platform designed to help you study with intention, not panic. 
                        We replace guesswork with guided, personalized study by combining AI-generated quizzes, real-time feedback, and performance insights.
                    </p>
                </div>

                {isVisible.principles && (
                  <div className="principles-grid">
                    {/* Mission */}
                    <div className="principle-card mission-card">
                      <div className="principle-icon">🎯</div>
                      <h3>Our Mission</h3>
                      <p>To empower students to learn deeply, track their understanding, and focus on what matters most across their academic journey.</p>
                      <ul className="principle-list">
                        <li><i className="fas fa-check-circle"></i> Replace guesswork with guided study</li>
                        <li><i className="fas fa-check-circle"></i> Assess knowledge and strengthen weak areas</li>
                        <li><i className="fas fa-check-circle"></i> Build mastery through active recall</li>
                        <li><i className="fas fa-check-circle"></i> Prepare with intention, not panic</li>
                      </ul>
                    </div>

                    {/* Vision */}
                    <div className="principle-card vision-card">
                      <div className="principle-icon">🚀</div>
                      <h3>Our Vision</h3>
                      <p>To redefine academic readiness by making purposeful, AI-powered study accessible to every student globally.</p>
                      <ul className="principle-list">
                        <li><i className="fas fa-check-circle"></i> Enable students to prepare smarter</li>
                        <li><i className="fas fa-check-circle"></i> Support mastery, not just survival</li>
                        <li><i className="fas fa-check-circle"></i> Scale globally with accessible tools</li>
                        <li><i className="fas fa-check-circle"></i> Transform how students prepare</li>
                      </ul>
                    </div>

                    {/* Values */}
                    <div className="principle-card values-card">
                      <div className="principle-icon">🧭</div>
                      <h3>Our Values</h3>
                      <p>We're committed to clarity, growth, focus, and integrity in every aspect of what we build.</p>
                      <ul className="principle-list">
                        <li><i className="fas fa-check-circle"></i> Clarity over confusion</li>
                        <li><i className="fas fa-check-circle"></i> Growth over shortcuts</li>
                        <li><i className="fas fa-check-circle"></i> Focus over panic</li>
                        <li><i className="fas fa-check-circle"></i> Integrity above all else</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="cta-section">
                    <h2>Study Smarter. <span className="brand-highlight">Perform Better.</span></h2>
                    <p>Join students who are preparing with purpose, not panic.</p>
                    <div className="hero-btns">
                      {!user ? (
                        <a href="#/account/signup" className="hero-btn primary">Get Started Free</a>
                      ) : (
                        <a href="/custom-quiz" className="hero-btn primary">Start Practicing</a>
                      )}
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
