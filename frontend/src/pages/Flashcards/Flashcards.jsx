import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudUploadAlt,
  faKeyboard,
  faSpinner,
  faList,
  faChartLine,
  faWandMagicSparkles,
  faExclamationCircle,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash,
  faLightbulb,
  faSave,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import djangoApi from '../../services/api';
import './Flashcards.css';

const SUBJECT_OPTIONS = [
  'Computer Science',
  'Mathematics',
  'Engineering',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'History',
  'Programming',
  'Other',
];

const ACCEPTED_FILE_EXTENSIONS = '.pdf,.docx,.pptx,.txt';

const normalizeCards = (rawCards) => {
  if (Array.isArray(rawCards)) {
    return rawCards
      .map((item) => ({
        id: item.id,
        question: item.question || item.front || '',
        answer: item.answer || item.back || '',
      }))
      .filter((item) => item.question && item.answer);
  }

  if (typeof rawCards === 'string') {
    try {
      const parsed = JSON.parse(rawCards);
      return normalizeCards(parsed);
    } catch {
      const match = rawCards.match(/\[[\s\S]*\]/);
      if (!match) return [];
      try {
        return normalizeCards(JSON.parse(match[0]));
      } catch {
        return [];
      }
    }
  }

  return [];
};

const qualityMap = {
  easy: 5,
  medium: 3,
  hard: 1,
};

const buildClientFallbackCards = (text, subject, count) => {
  const safeSubject = (subject || 'the topic').trim() || 'the topic';
  const normalized = (text || '').replace(/\\s+/g, ' ').trim();
  const chunks = normalized.split(/(?<=[.!?])\\s+/).filter(Boolean);
  const source = chunks.length ? chunks : [normalized || 'No source text provided.'];
  const max = Math.max(1, Math.min(Number(count) || 10, 25));
  return Array.from({ length: max }, (_, idx) => ({
    question: `Key point ${idx + 1} in ${safeSubject}?`,
    answer: source[idx % source.length].slice(0, 320),
  }));
};

const Flashcards = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('text');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [studyText, setStudyText] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [customPrompt, setCustomPrompt] = useState('');
  const [fileNameDisplay, setFileNameDisplay] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const [decks, setDecks] = useState([]);
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState('');

  const fileInputRef = useRef(null);

  const finalSubject = useMemo(
    () => (subject === 'Other' ? customSubject.trim() : subject.trim()),
    [subject, customSubject]
  );

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    const loadDecks = async () => {
      try {
        const response = await djangoApi.get('/flashcards/decks/');
        setDecks(response.data?.decks || []);
      } catch {
        showToast('Could not load your saved decks.', 'error');
      }
    };

    loadDecks();
  }, [isAuthenticated, navigate, showToast]);

  useEffect(() => {
    if (!toast.visible) return undefined;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const validateGenerateForm = () => {
    const errors = [];

    if (!finalSubject) errors.push('Please select or enter a subject.');

    if (activeTab === 'text') {
      if (studyText.trim().length < 30) errors.push('Please enter at least 30 characters of text.');
      if (studyText.length > 50000) errors.push('Text is too long (max 50,000 characters).');
    } else if (!studyText.trim()) {
      errors.push('Please extract text from an uploaded file first.');
    }

    if (Number(numCards) < 1 || Number(numCards) > 25) {
      errors.push('Number of cards must be between 1 and 25.');
    }

    setErrorMessages(errors);
    return errors.length === 0;
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessages(['File is too large. Maximum allowed size is 10MB.']);
      return;
    }

    setErrorMessages([]);
    setFileNameDisplay(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    setIsExtracting(true);

    const formData = new FormData();
    formData.append('slide_file', file);

    try {
      const response = await djangoApi.post('/flashcards/ajax-extract-text/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStudyText(response.data?.text || '');
      setActiveTab('text');
      showToast('Text extracted successfully.', 'success');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to extract text from file.';
      setErrorMessages([message]);
      showToast(message, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!validateGenerateForm()) return;

    setIsGenerating(true);
    setErrorMessages([]);
    setExplanation('');

    try {
      const response = await djangoApi.post('/flashcards/generate/', {
        subject: finalSubject,
        text: studyText,
        prompt: customPrompt.trim(),
        num_cards: Number(numCards),
        difficulty,
      });

      let cards = normalizeCards(response.data?.cards);
      if (!cards.length) {
        cards = buildClientFallbackCards(studyText, finalSubject, Number(numCards));
      }

      setGeneratedCards(cards);
      setSelectedDeck(null);
      setSelectedCards([]);
      setCurrentCardIndex(0);
      setShowAnswer(false);

      if (response.data?.fallback_used) {
        setErrorMessages([response.data?.warning || 'AI provider is unavailable. Showing fallback flashcards.']);
        showToast('Fallback flashcards generated.', 'info');
      } else {
        showToast(`Generated ${cards.length} flashcards.`, 'success');
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to generate flashcards.';
      const fallback = buildClientFallbackCards(studyText, finalSubject, Number(numCards));
      setGeneratedCards(fallback);
      setSelectedDeck(null);
      setSelectedCards([]);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setErrorMessages([`${message} Showing fallback flashcards instead.`]);
      showToast('AI unavailable. Fallback flashcards shown.', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDeck = async () => {
    if (!generatedCards.length) return;

    setIsSaving(true);
    try {
      const response = await djangoApi.post('/flashcards/decks/save/', {
        subject: finalSubject || selectedDeck?.title || 'Flashcards',
        cards: generatedCards.map((card) => ({
          question: card.question,
          answer: card.answer,
        })),
      });

      const deckId = response.data?.deck_id;
      if (!deckId) {
        throw new Error('Deck was not saved correctly.');
      }

      const decksResponse = await djangoApi.get('/flashcards/decks/');
      const freshDecks = decksResponse.data?.decks || [];
      setDecks(freshDecks);

      const savedDeck = freshDecks.find((deck) => deck.id === deckId);
      if (savedDeck) {
        setSelectedDeck(savedDeck);
      }

      const cardsResponse = await djangoApi.get(`/flashcards/decks/${deckId}/`);
      setSelectedCards(normalizeCards(cardsResponse.data?.cards));

      setGeneratedCards([]);
      showToast('Deck saved successfully.', 'success');
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to save deck.';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeck = async (deck) => {
    try {
      const response = await djangoApi.get(`/flashcards/decks/${deck.id}/`);
      const cards = normalizeCards(response.data?.cards);
      setSelectedDeck(deck);
      setSelectedCards(cards);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setGeneratedCards([]);
      setExplanation('');
    } catch {
      showToast('Could not load this deck.', 'error');
    }
  };

  const handleReview = async (level) => {
    const card = selectedCards[currentCardIndex];
    if (!card?.id) {
      showToast('Save this deck first to track review progress.', 'info');
      return;
    }

    try {
      await djangoApi.post('/flashcards/review/', {
        card_id: card.id,
        quality: qualityMap[level],
      });
      showToast('Review recorded.', 'success');
      setShowAnswer(false);
      setExplanation('');
      if (currentCardIndex < selectedCards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
      }
    } catch {
      showToast('Failed to save review.', 'error');
    }
  };

  const handleExplain = async () => {
    const card = selectedCards[currentCardIndex];
    if (!card) return;

    setIsExplaining(true);
    try {
      const response = await djangoApi.post('/flashcards/explain/', {
        question: card.question,
        answer: card.answer,
      });
      setExplanation(response.data?.explanation || '');
    } catch {
      showToast('Failed to generate explanation.', 'error');
    } finally {
      setIsExplaining(false);
    }
  };

  const resetCreationForm = () => {
    setSubject('');
    setCustomSubject('');
    setStudyText('');
    setNumCards(10);
    setDifficulty('intermediate');
    setCustomPrompt('');
    setFileNameDisplay('');
    setErrorMessages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentCard = selectedCards[currentCardIndex];
  const totalCards = selectedCards.length;
  const inStudyMode = Boolean(selectedDeck && totalCards > 0);

  return (
    <>
      <Navbar />
      <div className="flashcards-page-wrapper">
        {!inStudyMode ? (
          <div className="flashcards-card-container">
            <h1 className="flashcards-title">
              <FontAwesomeIcon /> 📖 Flashcards Mode
            </h1>
            <p className="flashcards-description">
              Build flashcards from your notes or uploaded material, then save and study with review tracking.
            </p>

            <form onSubmit={handleGenerate}>
              <div className="flashcards-subject-section">
                <label className="flashcards-label">Subject / Topic</label>
                <select
                  className="flashcards-select"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                >
                  <option value="" disabled>
                    Select a subject
                  </option>
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                {subject === 'Other' && (
                  <input
                    className="flashcards-input"
                    placeholder="Enter subject/topic"
                    value={customSubject}
                    onChange={(event) => setCustomSubject(event.target.value)}
                  />
                )}
              </div>

              <div className="flashcards-tab-group">
                <button
                  type="button"
                  className={`flashcards-tab ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <FontAwesomeIcon icon={faKeyboard} /> Enter Text
                </button>
                <button
                  type="button"
                  className={`flashcards-tab ${activeTab === 'file' ? 'active' : ''}`}
                  onClick={() => setActiveTab('file')}
                >
                  <FontAwesomeIcon icon={faCloudUploadAlt} /> Upload File
                </button>
              </div>

              {activeTab === 'text' && (
                <div className="flashcards-tab-content">
                  <textarea
                    value={studyText}
                    onChange={(event) => setStudyText(event.target.value)}
                    placeholder="Paste your study text here..."
                  />
                  <div className="flashcards-char-count">{studyText.length} / 50000 characters</div>
                </div>
              )}

              {activeTab === 'file' && (
                <div className="flashcards-tab-content">
                  <div className="flashcards-upload-zone">
                    <div className="flashcards-upload-title">Upload study material</div>
                    <div className="flashcards-upload-subtext">PDF, DOCX, PPTX, TXT (max 10MB)</div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept={ACCEPTED_FILE_EXTENSIONS}
                      className="flashcards-hidden-file"
                      onChange={(event) => handleFileSelect(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className="flashcards-file-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtracting}
                    >
                      {isExtracting ? <><FontAwesomeIcon icon={faSpinner} spin /> Extracting...</> : 'Select file'}
                    </button>
                    {fileNameDisplay && <div className="flashcards-file-name">{fileNameDisplay}</div>}
                  </div>
                </div>
              )}

              <div className="flashcards-options-row">
                <div className="flashcards-option-group">
                  <span><FontAwesomeIcon icon={faList} /> Number of Cards</span>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={numCards}
                    onChange={(event) => setNumCards(Number(event.target.value))}
                  />
                </div>

                <div className="flashcards-option-group">
                  <span><FontAwesomeIcon icon={faChartLine} /> Difficulty</span>
                  <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
              </div>

              <div className="flashcards-prompt-group">
                <label className="flashcards-label">
                  <FontAwesomeIcon icon={faWandMagicSparkles} /> Extra Instructions (optional)
                </label>
                <textarea
                  className="flashcards-prompt"
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  placeholder="Example: Focus on formulas and short exam-style definitions."
                />
              </div>

              <div className="flashcards-actions-row">
                <button type="submit" className="flashcards-main-btn" disabled={isExtracting || isGenerating}>
                  {isGenerating ? <><FontAwesomeIcon icon={faSpinner} spin /> Generating...</> : 'Generate Flashcards'}
                </button>
                <button type="button" className="flashcards-clear-btn" onClick={resetCreationForm}>
                  Clear
                </button>
              </div>
            </form>

            {errorMessages.length > 0 && (
              <div className="flashcards-messages-container">
                {errorMessages.map((msg, idx) => (
                  <div key={`${msg}-${idx}`} className="flashcards-error-message">
                    <FontAwesomeIcon icon={faExclamationCircle} /> {msg}
                  </div>
                ))}
              </div>
            )}

            {generatedCards.length > 0 && (
              <section className="flashcards-preview-section">
                <div className="flashcards-preview-header">
                  <h2>Generated Flashcards ({generatedCards.length})</h2>
                  <button className="flashcards-save-btn" onClick={handleSaveDeck} disabled={isSaving}>
                    {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</> : <><FontAwesomeIcon icon={faSave} /> Save Deck</>}
                  </button>
                </div>

                <div className="flashcards-preview-grid">
                  {generatedCards.map((card, index) => (
                    <article key={`gen-${index}`} className="flashcards-preview-card">
                      <p><strong>Q:</strong> {card.question}</p>
                      <p><strong>A:</strong> {card.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {decks.length > 0 && (
              <section className="flashcards-preview-section">
                <div className="flashcards-preview-header">
                  <h2>Saved Decks</h2>
                </div>
                <div className="flashcards-preview-grid">
                  {decks.map((deck) => (
                    <article key={deck.id} className="flashcards-preview-card">
                      <p><strong>{deck.title}</strong></p>
                      <p>Created: {new Date(deck.created_at).toLocaleString()}</p>
                      <button className="flashcards-open-btn" onClick={() => handleOpenDeck(deck)}>
                        Open Deck
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flashcards-card-container study-mode">
            <div className="flashcards-study-header">
              <button
                className="flashcards-back-btn"
                onClick={() => {
                  setSelectedDeck(null);
                  setSelectedCards([]);
                  setCurrentCardIndex(0);
                  setExplanation('');
                }}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
              <h2>{selectedDeck.title}</h2>
              <div className="flashcards-progress-pill">
                {currentCardIndex + 1} / {totalCards}
              </div>
            </div>

            <div className={`flashcards-study-card ${showAnswer ? 'show-answer' : ''}`}>
              <div className="flashcards-study-face front">
                <div className="flashcards-face-label">Question</div>
                <div className="flashcards-face-text">{currentCard?.question}</div>
              </div>
              <div className="flashcards-study-face back">
                <div className="flashcards-face-label">Answer</div>
                <div className="flashcards-face-text">{currentCard?.answer}</div>
              </div>
            </div>

            <div className="flashcards-study-actions">
              <button className="flashcards-main-btn" onClick={() => setShowAnswer((prev) => !prev)}>
                <FontAwesomeIcon icon={showAnswer ? faEyeSlash : faEye} /> {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
              <button className="flashcards-clear-btn" onClick={handleExplain} disabled={isExplaining}>
                {isExplaining ? <><FontAwesomeIcon icon={faSpinner} spin /> Explaining...</> : <><FontAwesomeIcon icon={faLightbulb} /> Explain</>}
              </button>
            </div>

            {explanation && (
              <div className="flashcards-explanation">
                <strong>Tutor explanation:</strong> {explanation}
              </div>
            )}

            <div className="flashcards-nav-row">
              <button
                className="flashcards-clear-btn"
                onClick={() => {
                  setShowAnswer(false);
                  setExplanation('');
                  setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentCardIndex === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} /> Previous
              </button>
              <button
                className="flashcards-clear-btn"
                onClick={() => {
                  setShowAnswer(false);
                  setExplanation('');
                  setCurrentCardIndex((prev) => Math.min(totalCards - 1, prev + 1));
                }}
                disabled={currentCardIndex === totalCards - 1}
              >
                Next <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>

            <div className="flashcards-review-row">
              <button className="review-btn easy" onClick={() => handleReview('easy')}>Easy</button>
              <button className="review-btn medium" onClick={() => handleReview('medium')}>Medium</button>
              <button className="review-btn hard" onClick={() => handleReview('hard')}>Hard</button>
            </div>
          </div>
        )}
      </div>

      {toast.visible && (
        <div className={`flashcards-toast ${toast.type}`}>
          {toast.type === 'success' && <FontAwesomeIcon icon={faCheckCircle} />}
          {toast.type === 'error' && <FontAwesomeIcon icon={faExclamationCircle} />}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default Flashcards;


