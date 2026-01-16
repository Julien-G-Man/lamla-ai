import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from '../styles/QuizResults.css';

const QuizResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const results = location.state?.results;
    
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackSent, setFeedbackSent] = useState(false);

    // Redirect if no results found
    useEffect(() => {
        if (!results) {
            navigate('/custom-quiz');
        }
    }, [results, navigate]);

    if (!results) return null;

    const { score, total, score_percent, details, subject } = results;

    const handleCopy = (text, e) => {
        navigator.clipboard.writeText(text);
        const btn = e.currentTarget;
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        setTimeout(() => btn.innerText = originalText, 2000);
    };

    const handleShare = () => {
        const shareData = {
            title: 'Lamla AI Quiz',
            text: `I scored ${score}/${total} on the ${subject} quiz!`,
            url: window.location.origin
        };
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(shareData.text + " " + shareData.url);
            alert("Link copied to clipboard!");
        }
    };

    const submitFeedback = async (val) => {
        setRating(val);
        // Add your API call to djangoApi here
        setFeedbackSent(true);
    };

    return (
        <div className={styles.resultsContainer}>
            {/* Summary Card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                    <h1>
                        {score_percent >= 80 ? "Excellent Work!" : 
                         score_percent >= 50 ? "Good Effort!" : "Time to Review!"}
                    </h1>
                    <p>You completed the <strong>{subject} Quiz</strong></p>
                </div>

                <div className={styles.scoreMetrics}>
                    <div className={styles.metric}>
                        <h2 style={{ color: score_percent >= 70 ? 'var(--success-green)' : 'var(--error-red)' }}>
                            {score}/{total}
                        </h2>
                        <p>Correct Answers</p>
                    </div>
                    <div className={styles.metric}>
                        <h2>{score_percent.toFixed(1)}%</h2>
                        <p>Overall Score</p>
                    </div>
                </div>

                <div className={styles.progressBarContainer}>
                    <div 
                        className={styles.progressBar} 
                        style={{ width: `${score_percent}%` }}
                    />
                </div>
            </div>

            {/* Detailed Review */}
            <div className={styles.reviewSection}>
                <h2 className="mb-4">Detailed Answer Review</h2>
                {details.map((detail, idx) => (
                    <div 
                        key={idx} 
                        className={`${styles.questionReviewItem} ${
                            detail.is_correct ? styles.correct : 
                            detail.user_answer ? styles.incorrect : styles.unanswered
                        }`}
                    >
                        <div className={styles.questionHeader}>
                            Q{idx + 1}. {detail.question}
                        </div>

                        <div className={styles.answerDetail}>
                            <div className={styles.answerLine}>
                                <span className={styles.answerLabel}>Your Answer:</span>
                                <span>{detail.user_answer || "(Unanswered)"}</span>
                            </div>
                            <div className={styles.answerLine}>
                                <span className={styles.answerLabel}>Correct Answer:</span>
                                <span className="flex items-center gap-2">
                                    {detail.correct_answer}
                                    <button 
                                        className={styles.actionBtn}
                                        onClick={(e) => handleCopy(detail.correct_answer, e)}
                                    >
                                        Copy
                                    </button>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feedback & Actions */}
            <div className={styles.summaryCard + " text-center"}>
                <h3>How was your experience?</h3>
                <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <i 
                            key={star}
                            className={`fas fa-star ${(hoverRating || rating) >= star ? styles.starRated : ''}`}
                            onMouseEnter={() => !feedbackSent && setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => !feedbackSent && submitFeedback(star)}
                        />
                    ))}
                </div>
                {feedbackSent && <p className="text-green-500">Thank you for your feedback! 🎉</p>}

                <div className="flex justify-center gap-4 mt-6">
                    <button className={styles.actionBtn} onClick={handleShare}>
                        <i className="fas fa-share-alt mr-2" /> Share
                    </button>
                    <Link to="/quiz/setup" className="btn primary">
                        Generate New Quiz
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;