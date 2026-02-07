import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styles from './QuizResults.css';
import djangoApi from '../../services/api';

const downloadAsText = (results) => {
    const { score, total, score_percent, details, subject, difficulty } = results;
    const timestamp = new Date().toLocaleString();
    
    let content = `QUIZ RESULTS REPORT\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Subject: ${subject}\n`;
    content += `Difficulty: ${difficulty}\n`;
    content += `Date: ${timestamp}\n`;
    content += `Score: ${score}/${total} (${score_percent.toFixed(1)}%)\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    content += `DETAILED ANSWER REVIEW\n`;
    content += `${'-'.repeat(60)}\n\n`;
    
    details.forEach((detail, idx) => {
        content += `Q${idx + 1}. ${detail.question}\n`;
        content += `Your Answer: ${detail.user_answer || '(Unanswered)'}\n`;
        content += `Correct Answer: ${detail.correct_answer}\n`;
        content += `Status: ${detail.is_correct ? 'CORRECT ✓' : 'INCORRECT ✗'}\n`;
        if (detail.reasoning) {
            content += `Evaluation: ${detail.reasoning}\n`;
        }
        if (detail.explanation) {
            content += `Explanation: ${detail.explanation}\n`;
        }
        content += '\n';
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Quiz_Results_${subject.replace(/\s+/g, '_')}.txt`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// PDF download via backend
const downloadAsPDF = async (results) => {
    try {
        const response = await djangoApi.post('/quiz/download/', {
            results: results,
            format: 'pdf'
        }, { responseType: 'blob' });
        
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Quiz_Results_${results.subject.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('PDF download failed:', err);
        alert('Failed to download PDF. Please try TXT or DOCX format.');
    }
};

const downloadAsDOCX = async (results) => {
    try {
        const response = await djangoApi.post('/quiz/download/', {
            results: results,
            format: 'docx'
        }, { responseType: 'blob' });
        
        const blob = response.data;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Quiz_Results_${results.subject.replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('DOCX download failed:', err);
        alert('Failed to download DOCX. Please try TXT or PDF format.');
    }
};

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
                            {detail.reasoning && (
                                <div className={styles.answerLine}>
                                    <span className={styles.answerLabel}>Evaluation:</span>
                                    <span className={styles.reasoning}>{detail.reasoning}</span>
                                </div>
                            )}
                            {detail.explanation && (
                                <div className={styles.answerLine}>
                                    <span className={styles.answerLabel}>Explanation:</span>
                                    <span className={styles.explanation}>{detail.explanation}</span>
                                </div>
                            )}
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

                <div className="flex justify-center gap-4 mt-6" style={{ flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                    <button className={styles.actionBtn} onClick={handleShare}>
                        <i className="fas fa-share-alt mr-2" /> Share
                    </button>
                    
                    {/* Download Buttons */}
                    <button className={styles.actionBtn} onClick={() => downloadAsText(results)} title="Download as Plain Text">
                        <i className="fas fa-file-alt mr-2" /> TXT
                    </button>
                    <button className={styles.actionBtn} onClick={() => downloadAsPDF(results)} title="Download as PDF">
                        <i className="fas fa-file-pdf mr-2" /> PDF
                    </button>
                    <button className={styles.actionBtn} onClick={() => downloadAsDOCX(results)} title="Download as Word Document">
                        <i className="fas fa-file-word mr-2" /> DOCX
                    </button>
                    
                    <Link to="/custom-quiz" className="btn primary">
                        Generate New Quiz
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;