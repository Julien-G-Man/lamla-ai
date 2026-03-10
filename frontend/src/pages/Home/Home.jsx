import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import djangoApi from "../../services/api";
import "./Home.css";
import "../../App.css";

const Home = ({ user }) => {
  const [contactStatus, setContactStatus] = useState("");
  const [isSendingContact, setIsSendingContact] = useState(false);

  const [isVisible, setIsVisible] = useState({
    about: false,
    features: false,
    testimonials: false,
  });

  useEffect(() => {
    const createObserver = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [key]: true }));
            obs.unobserve(entry.target);
          }
        },
        { threshold: 0.1 },
      );
      obs.observe(el);
      return obs;
    };

    const o1 = createObserver("about", "about");
    const o2 = createObserver("features", "features");
    const o3 = createObserver("testimonials", "testimonials");

    return () => {
      if (o1) o1.disconnect();
      if (o2) o2.disconnect();
      if (o3) o3.disconnect();
    };
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      title: formData.get("title"),
      message: formData.get("message"),
    };

    const gasUrl = process.env.REACT_APP_GAS_CONTACT_URL;

    try {
      setIsSendingContact(true);
      await djangoApi.post("/dashboard/contact/", payload);
      setContactStatus(
        "Thanks for reaching out. We will get back to you soon.",
      );

      if (gasUrl) {
        const res = await fetch(gasUrl, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
        "Content-Type": "application/json",
      },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "GAS error");
      } else {
        // Fallback to Django backend if GAS URL is not configured
        await djangoApi.post("/dashboard/contact/", payload);
      }

      setContactStatus("Thanks for reaching out. We will get back to you soon.");
      form.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      setContactStatus(
        "We could not send your message right now. Please try again.",
      );
    } finally {
      setIsSendingContact(false);
      setTimeout(() => setContactStatus(""), 3500);
    }
  };

  return (
    <div className="site-wrapper">
      <Navbar user={user} />

      <main className="main-content">
        {/* ── 1. HERO ── */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">🚀</span>
              <span>AI-Powered Learning Platform</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line">Level Up Your Exam</span>
              <span className="title-line">
                Game with <span className="brand-highlight">Lamla AI</span>
              </span>
            </h1>

            <p className="hero-desc">
              Upload your study materials and transform them into quizzes and
              flashcards. AI Tutor breaks down complex concepts into
              easy-to-understand explanations.
              <br></br>
              <strong className="highlight-text">
                {" "}
                Study smarter. Perform better.
              </strong>
            </p>

            <div className="hero-btns">
              {!user ? (
                <a href="/auth/signup" className="hero-btn primary">
                  Get Started Free
                </a>
              ) : (
                <a href="/quiz/create" className="hero-btn primary">
                  Start Practicing
                </a>
              )}
              <a href="#features" className="hero-btn secondary">
                Explore Features
              </a>
            </div>
          </div>
        </section>

        {/* ── 2. STATS BAND — hovers over the hero/about seam ── */}
        <div className="stats-band-wrapper">
          <div className="stats-band">
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">STUDENTS</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">250+</span>
              <span className="stat-label">QUIZZES GENERATED</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">92%</span>
              <span className="stat-label">SUCCESS RATE</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">3+</span>
              <span className="stat-label">AI FEATURES</span>
            </div>
          </div>
        </div>

        {/* ── 3. ABOUT ── */}
        <section id="about" className="principles-section">
          <div className="container">
            {isVisible.about && (
              <div className="principles-grid">
                {/* Image — Left */}
                <div className="principle-card">
                  <img
                    src="/assets/highfive-with-teacher.jpg"
                    alt="About Lamla AI"
                  />
                  <div className="principle-icon">AI-Powered Study Tool</div>
                </div>

                {/* Text — Right */}
                <div className="principle-card principle-text">
                  <p className="about-label">ABOUT LAMLA AI</p>
                  <h3>
                    Smarter Studying,{" "}
                    <span className="brand-highlight-text">Better Results</span>
                  </h3>
                  <p>
                    Lamla AI was built for students who want to study with
                    purpose. We combine cutting-edge AI with your own course
                    materials to create a personalised study experience that
                    actually works.
                  </p>
                  <p>
                    Whether you're preparing for finals or just reviewing before
                    a test — Lamla AI turns your slides and notes into quizzes,
                    flashcards, and instant AI-powered explanations.
                  </p>
                  <p>
                    Built by students, for students. Our platform evolves with
                    your feedback so you can walk into every exam with
                    confidence.
                  </p>
                  <div className="hero-btns about-btns">
                    <a href="/quiz/create" className="hero-btn primary">
                      Start Studying →
                    </a>
                    <a href="#features" className="hero-btn secondary">
                      Our Features
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── 4. FEATURES ── */}
        <section id="features" className="features-section">
          <div className="container">
            <div className="section-header section-header--left">
              <p className="section-label">✨ FEATURES</p>
              <div className="section-header-row">
                <h2>
                  Smart Features for{" "}
                  <span className="brand-highlight-text">Smart Students</span>
                </h2>
              </div>
            </div>

            {isVisible.features && (
              <div className="features-grid">
                <a href="/quiz/create" className="feature-card">
                  <div className="feature-image">
                    <img src="/assets/quizzes.jpg" alt="Quiz Mode" />
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">Quiz Mode</h3>
                    <p className="feature-desc">
                      Automatically generates multiple-choice questions from
                      your materials.
                    </p>
                    <span className="feature-link">Explore Feature →</span>
                  </div>
                </a>

                <a href="/ai-tutor" className="feature-card">
                  <div className="feature-image">
                    <img src="/assets/ai-tutor.jpg" alt="AI Tutor" />
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">AI Tutor</h3>
                    <p className="feature-desc">
                      Get instant answers to your questions and deeper
                      explanations.
                    </p>
                    <span className="feature-link">Explore Feature →</span>
                  </div>
                </a>

                <a href="/flashcards" className="feature-card">
                  <div className="feature-image">
                    <img src="/assets/flashcards.jpeg" alt="Flashcards" />
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">Flashcards</h3>
                    <p className="feature-desc">
                      Create and study with AI-generated flashcards for quick
                      review.
                    </p>
                    <span className="feature-link">Explore Feature →</span>
                  </div>
                </a>

                <a href="/#exam-analyzer" className="feature-card">
                  <div className="feature-image">
                    <img src="/assets/uni_exams.jpg" alt="Exam Analyzer" />
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">Exam Analysis</h3>
                    <p className="feature-desc">
                      Analyze uploaded exams or slides for instant feedback and
                      topic breakdowns.
                    </p>
                    <span className="feature-link">Explore Feature →</span>
                  </div>
                </a>

                <a href="/dashboard" className="feature-card">
                  <div className="feature-image">
                    <img
                      src="/assets/improve-performance.jpg"
                      alt="Performance Analytics"
                    />
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">Performance Analytics</h3>
                    <p className="feature-desc">
                      Track your progress and identify weak points to focus your
                      efforts.
                    </p>
                    <span className="feature-link">Explore Feature →</span>
                  </div>
                </a>

                <a href="/materials" className="feature-card">
                  <div className="feature-image">
                    <img src="/assets/steam.jpg" alt="Uploaded Materials" />
                  </div>
                  <div className="feature-card-content">
                    <h3 className="feature-title">Materials</h3>
                    <p className="feature-desc">
                      Don't have slides? Select from a wide range of material
                      uploaded by our students community.
                    </p>
                    <span className="feature-link">Explore Feature →</span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── 5. TESTIMONIALS ── */}
        <section id="testimonials" className="testimonials-section">
          <div className="container">
            <div className="section-header section-header--left">
              <p className="section-label">⭐ TESTIMONIALS</p>
              <h2>
                What Our Users{" "}
                <span className="brand-highlight-text">Have To Say</span>
              </h2>
            </div>
            {isVisible.testimonials && (
              <div className="testimonials-grid">
                <div className="testimonial-card">
                  <blockquote className="testimonial-quote">
                    "Lamla AI helped me turn my lecture slides into practice
                    quizzes in seconds. It's an amazing tool!"
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
            )}
          </div>
        </section>

        <section className="home-engagement-section">
          <div className="container">
            <div className="home-engagement-grid">
              <form
                className="home-contact-shell"
                onSubmit={handleContactSubmit}
              >
                <div className="home-contact-copy">
                  <p className="section-label">GET IN TOUCH</p>
                  <h3>Have Questions? Send Us A Message</h3>
                  <p>
                    Tell us what you need and the Lamla team will respond as
                    soon as possible.
                  </p>
                </div>
                <div className="home-contact-form">
                  <div className="home-contact-row">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Your email"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="title"
                    placeholder="Subject"
                    required
                  />
                  <textarea
                    name="message"
                    rows="4"
                    placeholder="Type your message..."
                    required
                  />
                  <button type="submit" disabled={isSendingContact}>
                    {isSendingContact ? "Sending..." : "Send Message"}
                  </button>
                  {contactStatus && (
                    <p className="home-contact-status">{contactStatus}</p>
                  )}
                </div>
              </form>

              <div className="post-testimonials-cta">
                <div className="post-testimonials-copy">
                  <p className="section-label">READY TO START?</p>
                  <h3>Turn Your Notes Into Better Performance Today</h3>
                  <p>
                    Join Lamla AI to generate smarter quizzes, track progress,
                    and build real exam confidence.
                  </p>
                </div>
                <div className="post-testimonials-actions">
                  <a href="/auth/signup" className="cta-btn cta-btn-solid">
                    Sign Up
                  </a>
                  <a href="/quiz/create" className="cta-btn cta-btn-outline">
                    Go To Quiz
                  </a>
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
