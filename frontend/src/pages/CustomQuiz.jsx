import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import djangoApi from '../services/api';
import '../styles/CustomQuiz.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faKeyboard, 
    faCloudUploadAlt, 
    faListUl, 
    faPen, 
    faClock, 
    faChartLine, 
    faSpinner, 
    faExclamationCircle,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const CustomQuiz = ({ user }) => {
    const navigate = useNavigate();

    // --- State Variables ---
    const [activeTab, setActiveTab] = useState('textContent');
    const [subject, setSubject] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [isOtherSelected, setIsOtherSelected] = useState(false);
    const [studyText, setStudyText] = useState('');
    const [numMcq, setNumMcq] = useState(7);
    const [numShort, setNumShort] = useState(3);
    const [quizTime, setQuizTime] = useState(10);
    const [difficulty, setDifficulty] = useState('random');
    
    const [isExtracting, setIsExtracting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [fileNameDisplay, setFileNameDisplay] = useState('');
    const [errorMessages, setErrorMessages] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    // --- Refs ---
    const fileInputRef = useRef(null);

    // --- Helpers ---
    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type, visible: true });
    }, []);

    // Effect to auto-hide toast 
    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);

    const handleSubjectChange = (e) => {
        const val = e.target.value;
        setSubject(val);
        setIsOtherSelected(val === 'Other');
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileNameDisplay(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        setIsExtracting(true);

        const formData = new FormData();
        formData.append('slide_file', file);

        try {
            const response = await djangoApi.post('/quiz/ajax-extract-text/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.text) {
                setStudyText(response.data.text);
                setActiveTab('textContent'); // Switch tab like plain JS switchToTextTabWithContent
                showToast(`Text extracted successfully!`, 'success');
                console.log(`Text extracted from file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
            }
        } catch (err) {
            showToast("Failed to extract text.", "error");
        } finally {
            setIsExtracting(false);
        }
    };

    const validateForm = () => {
        const errors = [];
        const finalSubject = isOtherSelected ? customSubject.trim() : subject;

        if (!finalSubject) errors.push('Please select or enter a subject');
        
        if (activeTab === 'textContent') {
            if (studyText.trim().length < 30) errors.push('Please enter at least 30 characters of text');
            if (studyText.length > 50000) errors.push('Text is too long (max 50,000)');
        } else {
            if (!fileInputRef.current?.files.length) errors.push('Please upload a file');
        }

        if (numMcq <= 0 && numShort <= 0) errors.push('Select at least one question type');
        if (numMcq > 20) errors.push('Maximum MCQ is 20');
        if (numShort > 10) errors.push('Maximum Short Answer is 10');

        setErrorMessages(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        // Logical check for "Other" vs Dropdown
        const finalSubject = isOtherSelected ? customSubject.trim() : subject;

        if (!finalSubject) {
          setErrorMessages(['Please select a subject']);
          return;
        }

        setIsGenerating(true);
        try {
          const response = await djangoApi.post('/quiz/generate/', {
            subject: finalSubject,
            extractedText: studyText,
            num_mcq: numMcq,
            num_short: numShort,
            quiz_time: quizTime,
            difficulty: difficulty
          });
          navigate('/quiz/results', { state: { quizData: response.data } });
        } catch (err) {
            showToast(err.response?.data?.error || "Generation failed", 'error');
            setIsGenerating(false);
        }
    };

    const handleClear = () => {
        if (window.confirm('Clear all fields?')) {
            setSubject('');
            setCustomSubject('');
            setIsOtherSelected(false);
            setStudyText('');
            setFileNameDisplay('');
            setNumMcq(7);
            setNumShort(3);
            setQuizTime(10);
            setErrorMessages([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            showToast('Form cleared', 'info');
        }
    };

    return (
        <>
            <Navbar user={user} />
            <div className="page-wrapper">
                <div className="quiz-card-container">
                    <h1 className="main-page-title">🧠 Quiz Mode</h1>
                    <p className="main-page-description">
                        Upload your study materials or paste content to create customized quiz questions with AI.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Subject Section */}
                        <div className="subject-section">
                            <label className="subject-label">
                                <span>📚</span> Subject / Topic
                            </label>
                            <select 
                                className="subject-select" 
                                value={subject} 
                                onChange={handleSubjectChange}
                            >
                                <option value="" disabled>Select a subject or topic</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Biology">Biology</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Physics">Physics</option>
                                <option value="English">English</option>
                                <option value="History">History</option>
                                <option value="Geography">Geography</option>
                                <option value="Economics">Economics</option>
                                <option value="Other">Other (type your own)</option>
                            </select>

                            {isOtherSelected && (
                                <div className="custom-subject-container" style={{ marginTop: '12px' }}>
                                    <input 
                                        type="text" 
                                        className="subject-input" 
                                        placeholder="Type subject/topic (e.g. 'Quantum Mechanics')"
                                        value={customSubject}
                                        onChange={(e) => setCustomSubject(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="subject-hint">
                                <FontAwesomeIcon icon={faInfoCircle} /> Select your subject or enter a custom one.
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="tab-group">
                            <button 
                                type="button" 
                                className={`tab ${activeTab === 'textContent' ? 'active' : ''}`}
                                onClick={() => setActiveTab('textContent')}
                            >
                                <FontAwesomeIcon icon={faKeyboard} /> Enter Text
                            </button>
                            <button 
                                type="button" 
                                className={`tab ${activeTab === 'fileContent' ? 'active' : ''}`}
                                onClick={() => setActiveTab('fileContent')}
                            >
                                <FontAwesomeIcon icon={faCloudUploadAlt} /> Upload File
                            </button>
                        </div>

                        {/* Text Tab Content */}
                        {activeTab === 'textContent' && (
                            <div className="tab-content active slide-in">
                                <textarea 
                                    placeholder="Paste your study materials here..." 
                                    value={studyText}
                                    onChange={(e) => setStudyText(e.target.value)}
                                />
                                <div className="character-count">
                                    <span>{studyText.length}</span> / 50000 characters
                                </div>
                            </div>
                        )}

                        {/* File Tab Content */}
                        {activeTab === 'fileContent' && (
                            <div className="tab-content active slide-in">
                                <div 
                                    className="upload-zone"
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#FFD600'; }}
                                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#E6C200'; }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleFileChange({ target: { files: e.dataTransfer.files } });
                                    }}
                                >
                                    <div className="upload-icon">📖</div>
                                    <div className="upload-text">Upload your study materials</div>
                                    <div className="upload-description">PDF, DOCX, PPT, PPTX, or TXT</div>
                                    
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden-file-input" 
                                        accept=".pdf,.docx,.ppt,.pptx,.txt"
                                        id="slideFile"
                                    />
                                    <label htmlFor="slideFile" className="select-file-button">
                                        {isExtracting ? 'Extracting...' : 'Select file'}
                                    </label>
                                    <span className="file-name-display">{fileNameDisplay}</span>
                                </div>
                            </div>
                        )}

                        {/* Options Row */}
                        <div className="options-row">
                            <div className="option-group">
                                <span><FontAwesomeIcon icon={faListUl} /> MCQ Questions</span>
                                <input type="number" value={numMcq} onChange={(e) => setNumMcq(e.target.value)} min="0" max="20" className="number-input" />
                            </div>
                            <div className="option-group">
                                <span><FontAwesomeIcon icon={faPen} /> Short Answer</span>
                                <input type="number" value={numShort} onChange={(e) => setNumShort(e.target.value)} min="0" max="10" className="number-input" />
                            </div>
                            <div className="option-group">
                                <span><FontAwesomeIcon icon={faClock} /> Quiz Time (min)</span>
                                <input type="number" value={quizTime} onChange={(e) => setQuizTime(e.target.value)} min="1" max="120" className="number-input" />
                            </div>
                            <div className="option-group">
                                <span><FontAwesomeIcon icon={faChartLine} /> Difficulty</span>
                                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                    <option value="random">Random</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="actions-row">
                            <button type="submit" className="main-btn" disabled={isGenerating || isExtracting}>
                                {isGenerating ? <><FontAwesomeIcon icon={faSpinner} spin /> Generating...</> : 'Generate Questions'}
                            </button>
                            <button type="button" className="clear-btn" onClick={handleClear}>Clear</button>
                        </div>
                    </form>

                    {/* Error Messages */}
                    {errorMessages.length > 0 && (
                        <div className="messages-container">
                            {errorMessages.map((msg, i) => (
                                <div key={i} className="api-error-message">
                                    <FontAwesomeIcon icon={faExclamationCircle} /> {msg}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast.visible && (
                <div className={`toast ${toast.type}`} style={{ display: 'block' }}>
                    {toast.message}
                </div>
            )}
        </>
    );
};

export default CustomQuiz;