import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/Quiz.css';
import djangoApi from '../services/api';

const Quiz = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Updated redirect path to match your Django URL name 'custom_quiz'
    const { quizData } = location.state || { quizData: null };
    const REDIRECT_PATH = '/custom-quiz'; 

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isTimeHidden, setIsTimeHidden] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allQuestions = quizData 
        ? [...(quizData.mcq_questions || []), ...(quizData.short_questions || [])]
        : [];
    
    const storageKey = `lamla_quiz_${quizData?.id || 'temp'}`;

    // --- Submission Logic ---
    const submitQuiz = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await djangoApi.post('/quiz/submit/', {
                quiz_id: quizData.id,
                user_answers: userAnswers,
                total_questions: allQuestions.length
            });
            localStorage.removeItem(storageKey);
            navigate('/quiz/results', { state: { results: response.data } });
        } catch (err) {
            console.error("Submission failed", err);
            setIsSubmitting(false);
            alert("Failed to submit quiz. Please check your connection.");
        }
    }, [isSubmitting, quizData, userAnswers, allQuestions.length, storageKey, navigate]);

    const handleAutoSubmit = useCallback(() => {
        alert("Time's up! Submitting your answers.");
        submitQuiz();
    }, [submitQuiz]);

    // --- Initialization & Persistence ---
    useEffect(() => {
        if (!quizData) {
            navigate(REDIRECT_PATH);
            return;
        }

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            setUserAnswers(parsed.userAnswers || {});
            setFlaggedQuestions(parsed.flaggedQuestions || {});
            setCurrentIndex(parsed.currentIndex || 0);
            const remaining = Math.max(0, Math.floor((parsed.endTime - Date.now()) / 1000));
            setTimeRemaining(remaining);
        } else {
            const initialSeconds = (quizData.time_limit || 10) * 60;
            setTimeRemaining(initialSeconds);
        }
    }, [quizData, navigate, storageKey, REDIRECT_PATH]);

    // --- Timer Loop ---
    useEffect(() => {
        if (timeRemaining <= 0 && !isSubmitting && quizData) {
            handleAutoSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, isSubmitting, handleAutoSubmit, quizData]);

    // --- Auto-save ---
    useEffect(() => {
        if (quizData) {
            const state = {
                userAnswers,
                flaggedQuestions,
                currentIndex,
                endTime: Date.now() + (timeRemaining * 1000)
            };
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [userAnswers, flaggedQuestions, currentIndex, timeRemaining, storageKey, quizData]);

    // --- Handlers ---
    const handleAnswer = (val) => {
        setUserAnswers(prev => ({ ...prev, [currentIndex]: val }));
    };

    const toggleFlag = () => {
        setFlaggedQuestions(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    if (!quizData || allQuestions.length === 0) return null;

    const currentQ = allQuestions[currentIndex];

    return (
        <div className={styles.quizContainer}>
            <div className={styles.topHeader}>
                <div className={styles.timer}>
                    <span>Time left</span>
                    <span className={`${styles.timerDisplay} ${isTimeHidden ? styles.invisible : ''}`}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>
                <button className={styles.hideBtn} onClick={() => setIsTimeHidden(!isTimeHidden)}>
                    {isTimeHidden ? 'Show' : 'Hide'}
                </button>
            </div>

            <div className={styles.metaCard}>
                <div className={styles.questionNumber}>Question {currentIndex + 1}</div>
                <div className={styles.questionStatus}>
                    {userAnswers[currentIndex] ? 'Answered' : 'Not yet answered'}
                </div>
            </div>

            <div className={styles.questionCard}>
                <div 
                    className={styles.questionBody}
                    dangerouslySetInnerHTML={{ __html: currentQ.question }}
                />

                <div className={styles.optionsList}>
                    {currentQ.options ? (
                        currentQ.options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return (
                                <div 
                                    key={idx} 
                                    className={`${styles.optionItem} ${userAnswers[currentIndex] === letter ? styles.selected : ''}`}
                                    onClick={() => handleAnswer(letter)}
                                >
                                    <div className={styles.optionLabel}>
                                        <div className={styles.radioCircle} />
                                        <span>{letter}. {opt}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <textarea
                            className={styles.shortAnswerInput}
                            placeholder="Type your answer here..."
                            value={userAnswers[currentIndex] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                        />
                    )}
                </div>

                <div className={styles.navActions}>
                    <button className={styles.actionBtn} onClick={toggleFlag}>
                        {flaggedQuestions[currentIndex] ? '🚩 Unflag' : '🏳️ Flag Question'}
                    </button>

                    <div className="flex gap-2">
                        <button 
                            className={styles.actionBtn}
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                        >
                            ◀ Previous
                        </button>
                        
                        {currentIndex === allQuestions.length - 1 ? (
                            <button className={styles.primaryBtn} onClick={submitQuiz} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Finish & Submit'}
                            </button>
                        ) : (
                            <button className={styles.primaryBtn} onClick={() => setCurrentIndex(prev => prev + 1)}>
                                Next ▶
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <button className={styles.floatBtn} onClick={() => setIsPanelOpen(true)}>☰</button>
            <aside className={`${styles.questionPanel} ${isPanelOpen ? styles.panelActive : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3>Navigator</h3>
                    <button onClick={() => setIsPanelOpen(false)}>×</button>
                </div>
                <div className={styles.grid}>
                    {allQuestions.map((_, i) => (
                        <button
                            key={i}
                            className={`
                                ${styles.gridBtn} 
                                ${currentIndex === i ? styles.gridBtnActive : ''} 
                                ${userAnswers[i] ? styles.gridBtnAnswered : ''}
                                ${flaggedQuestions[i] ? styles.gridBtnFlagged : ''}
                            `}
                            onClick={() => {
                                setCurrentIndex(i);
                                setIsPanelOpen(false);
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </aside>
        </div>
    );
};

export default Quiz;