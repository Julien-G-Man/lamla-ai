import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Quiz.css';
import djangoApi from '../../services/api';

const Quiz = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { quizData } = location.state || { quizData: null };
    const REDIRECT_PATH = '/custom-quiz'; 

    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timerInitialized, setTimerInitialized] = useState(false);
    const [isTimeHidden, setIsTimeHidden] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allQuestions = quizData 
        ? [...(quizData.mcq_questions || []), ...(quizData.short_questions || [])]
        : [];
    
    const storageKey = `lamla_quiz_${quizData?.id || 'temp'}`;
    const autoSubmittedRef = useRef(false);  // Prevent multiple auto-submit calls
    const initializedRef = useRef(false);  // Track if timer has been initialized

    // --- Submission Logic ---
    const submitQuiz = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await djangoApi.post('/quiz/submit/', {
                quiz_id: quizData.id,
                quiz_data: quizData,  // Send full quiz data for answer validation
                user_answers: userAnswers,
                total_questions: allQuestions.length
            });
            localStorage.removeItem(storageKey);
            navigate('/quiz/results', { state: { results: response.data } });
        } catch (err) {
            console.error("Submission failed", err);
            setIsSubmitting(false);
            alert(err.response?.data?.error || "Failed to submit quiz. Please check your connection.");
        }
    }, [isSubmitting, quizData, userAnswers, allQuestions.length, storageKey, navigate]);

    // --- Initialization & Persistence ---
    useEffect(() => {
        // Prevent multiple initializations
        if (initializedRef.current) return;
        
        if (!quizData) {
            navigate(REDIRECT_PATH);
            return;
        }

        initializedRef.current = true;

        const saved = localStorage.getItem(storageKey);
        if (saved) {
            // Resume existing quiz
            const parsed = JSON.parse(saved);
            setUserAnswers(parsed.userAnswers || {});
            setFlaggedQuestions(parsed.flaggedQuestions || {});
            setCurrentIndex(parsed.currentIndex || 0);
            const remaining = Math.max(0, Math.floor((parsed.endTime - Date.now()) / 1000));
            console.log('Quiz resumed with remaining time:', remaining, 'seconds');
            setTimeRemaining(remaining);
            setTimerInitialized(true);
        } else {
            // New quiz - initialize with full time
            // quizData.time_limit should be a number (minutes) from backend
            const timeLimitMinutes = parseInt(quizData.time_limit, 10);
            
            if (isNaN(timeLimitMinutes) || timeLimitMinutes <= 0) {
                console.error('Invalid time_limit:', quizData.time_limit, '- defaulting to 10 minutes');
                const defaultSeconds = 10 * 60;
                setTimeRemaining(defaultSeconds);
            } else {
                const initialSeconds = timeLimitMinutes * 60;
                console.log('Starting new quiz with time limit:', timeLimitMinutes, 'minutes =', initialSeconds, 'seconds');
                setTimeRemaining(initialSeconds);
            }
            setTimerInitialized(true);
        }
    }, [quizData, navigate, storageKey, REDIRECT_PATH]);

    // --- Timer Countdown Interval ---
    useEffect(() => {
        // Don't run until timer is initialized and time is valid
        if (!timerInitialized || timeRemaining === undefined) {
            return;
        }

        // Create single interval that ticks down every second
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                const newTime = Math.max(0, prev - 1);
                // Log every 60 seconds and when time is running out
                if (newTime % 60 === 0 || newTime <= 60) {
                    console.log('Quiz time remaining:', newTime, 'seconds');
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timerInitialized]);

    // --- Auto-Submit When Time Runs Out ---
    useEffect(() => {
        if (timerInitialized && timeRemaining <= 0 && !autoSubmittedRef.current && !isSubmitting) {
            console.log('Time is up! Auto-submitting quiz...');
            autoSubmittedRef.current = true;
            alert("Time's up! Submitting your answers.");
            submitQuiz();
        }
    }, [timeRemaining, timerInitialized, isSubmitting, submitQuiz]);

    // --- Auto-save (only after timer is initialized) ---
    useEffect(() => {
        if (quizData && timerInitialized && timeRemaining > 0) {
            const state = {
                userAnswers,
                flaggedQuestions,
                currentIndex,
                endTime: Date.now() + (timeRemaining * 1000)
            };
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [userAnswers, flaggedQuestions, currentIndex, timeRemaining, storageKey, quizData, timerInitialized]);

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

    if (!quizData || allQuestions.length === 0) {
        console.error('Quiz render blocked - missing data. quizData:', !!quizData, 'questions:', allQuestions.length);
        return null;
    }

    // Don't render quiz until timer is properly initialized
    if (!timerInitialized) {
        return <div className={styles.quizContainer}><p>Loading quiz...</p></div>;
    }

    // Additional safeguard: if timeRemaining is invalid, show error
    if (timeRemaining === undefined || timeRemaining === null || isNaN(timeRemaining)) {
        console.error('Invalid timeRemaining state:', timeRemaining);
        return <div className={styles.quizContainer}><p>Error: Timer initialization failed. Please refresh the page.</p></div>;
    }

    const currentQ = allQuestions[currentIndex];
    
    // Calculate progress bar width (percent of time remaining)
    const timeLimitMinutes = parseInt(quizData.time_limit, 10) || 10;
    const totalSeconds = timeLimitMinutes * 60;
    const timePercent = Math.max(0, (timeRemaining / totalSeconds) * 100);
    // Color changes based on time remaining: green > yellow > red
    const timerColor = timePercent > 33 ? '#03903e' : timePercent > 10 ? '#FF9800' : '#bd2413';

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

            {/* Timer Progress Bar */}
            <div className={styles.timerProgressContainer}>
                <div 
                    className={styles.timerProgressBar} 
                    style={{ width: `${timePercent}%`, backgroundColor: timerColor }}
                />
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