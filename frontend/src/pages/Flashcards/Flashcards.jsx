import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudUploadAlt,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faEye,
  faEyeSlash,
  faTrash,
  faDownload,
  faPlus,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import djangoApi from '../../services/api';
import './Flashcards.css';

const Flashcards = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const [uploadState, setUploadState] = useState('idle');
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState({});
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);
  const dragOverRef = useRef(false);

  const handleFileSelect = async (file) => {
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PDF, Word document, or text file');
      return;
    }

    setUploadState('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await djangoApi.post('/flashcards/generate/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newSet = {
        id: response.data.id || Date.now(),
        title: response.data.title || file.name,
        cards: response.data.cards || [],
        createdAt: new Date().toISOString(),
      };

      setFlashcardSets(prev => [newSet, ...prev]);
      setSelectedSet(newSet);
      setCurrentCardIndex(0);
      setShowAnswers({});
      setUploadState('success');

      setTimeout(() => setUploadState('idle'), 3000);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to generate flashcards');
      setUploadState('error');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dragOverRef.current = true;
  };

  const handleDragLeave = () => {
    dragOverRef.current = false;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const goToNextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const goToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const toggleAnswer = () => {
    setShowAnswers(prev => ({
      ...prev,
      [currentCardIndex]: !prev[currentCardIndex],
    }));
  };

  const deleteSet = (setId) => {
    setFlashcardSets(prev => prev.filter(set => set.id !== setId));
    if (selectedSet?.id === setId) {
      setSelectedSet(null);
      setCurrentCardIndex(0);
    }
  };

  const selectSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
    setShowAnswers({});
  };

  if (!selectedSet) {
    return (
      <div className="flashcards-container">
        <Navbar />
        <main className="flashcards-main">
          <div className="flashcards-header">
            <h1>Flashcards</h1>
            <p>Upload materials to generate smart flashcards powered by AI</p>
          </div>

          <section className="upload-section">
            <div
              className={`upload-box ${dragOverRef.current ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FontAwesomeIcon
                icon={uploadState === 'uploading' ? faSpinner : faCloudUploadAlt}
                className={`upload-icon ${uploadState === 'uploading' ? 'spin' : ''}`}
              />
              <h3>
                {uploadState === 'uploading'
                  ? 'Processing your file...'
                  : 'Drag and drop your file here'}
              </h3>
              <p>or</p>
              <button
                className="upload-btn-text"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'uploading'}
              >
                Click to select
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept=".pdf,.docx,.txt"
                style={{ display: 'none' }}
              />
              <p className="upload-hint">PDF, Word, or text files (max 25MB)</p>
            </div>

            {uploadError && (
              <div className="error-message">
                <FontAwesomeIcon icon={faExclamationCircle} />
                {uploadError}
              </div>
            )}

            {uploadState === 'success' && (
              <div className="success-message">
                ✓ Flashcards generated successfully!
              </div>
            )}
          </section>

          {flashcardSets.length > 0 && (
            <section className="flashcard-sets-section">
              <h2>Your Flashcard Sets</h2>
              <div className="sets-grid">
                {flashcardSets.map(set => (
                  <div key={set.id} className="set-card">
                    <div className="set-header">
                      <h3>{set.title}</h3>
                      <button
                        className="delete-btn"
                        onClick={() => deleteSet(set.id)}
                        title="Delete this set"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    <p className="set-meta">{set.cards?.length || 0} cards</p>
                    <button
                      className="set-action-btn"
                      onClick={() => selectSet(set)}
                    >
                      <FontAwesomeIcon icon={faEye} /> Study
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  const currentCard = selectedSet.cards[currentCardIndex];
  const isAnswerShown = showAnswers[currentCardIndex];
  const totalCards = selectedSet.cards.length;

  return (
    <div className="flashcards-container">
      <Navbar />
      <main className="flashcards-main flashcards-study">
        <div className="study-header">
          <button className="back-btn" onClick={() => setSelectedSet(null)}>
            ← Back to Sets
          </button>
          <h1>{selectedSet.title}</h1>
          <div className="progress">
            {currentCardIndex + 1} / {totalCards}
          </div>
        </div>

        <div className="flashcard-container">
          <div className={`flashcard ${isAnswerShown ? 'flipped' : ''}`}>
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <div className="card-label">Question</div>
                <div className="card-content">
                  {currentCard?.question || currentCard?.front || 'Loading...'}
                </div>
              </div>

              <div className="flashcard-back">
                <div className="card-label">Answer</div>
                <div className="card-content">
                  {currentCard?.answer || currentCard?.back || 'Loading...'}
                </div>
              </div>
            </div>
          </div>

          <button className="toggle-btn" onClick={toggleAnswer}>
            <FontAwesomeIcon icon={isAnswerShown ? faEyeSlash : faEye} />
            {isAnswerShown ? 'Hide Answer' : 'Show Answer'}
          </button>
        </div>

        <div className="card-navigation">
          <button
            className="nav-btn"
            onClick={goToPrevCard}
            disabled={currentCardIndex === 0}
          >
            <FontAwesomeIcon icon={faChevronLeft} /> Previous
          </button>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentCardIndex + 1) / totalCards) * 100}%`,
              }}
            />
          </div>

          <button
            className="nav-btn"
            onClick={goToNextCard}
            disabled={currentCardIndex === totalCards - 1}
          >
            Next <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>

        <div className="card-actions">
          <button className="action-btn secondary">
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
          <button
            className="action-btn danger"
            onClick={() => deleteSet(selectedSet.id)}
          >
            <FontAwesomeIcon icon={faTrash} /> Delete Set
          </button>
          <button className="action-btn" onClick={() => setSelectedSet(null)}>
            <FontAwesomeIcon icon={faPlus} /> Create New Set
          </button>
        </div>
      </main>
    </div>
  );
};

export default Flashcards;
