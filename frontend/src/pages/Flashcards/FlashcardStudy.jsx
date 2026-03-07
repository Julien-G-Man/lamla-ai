import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import djangoApi, { getApiErrorMessage } from "../../services/api";
import "./Flashcards.css";

const qualityMap = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

export default function FlashcardStudy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    const load = async () => {
      setError("");
      try {
        const res = await djangoApi.get(`/flashcards/deck/${id}/`);
        setCards(res.data?.cards || []);
        setIdx(0);
      } catch (err) {
        console.error("Load study deck failed", err);
        setError(getApiErrorMessage(err, "Failed to load deck for study."));
      }
    };

    load();
  }, [id, isAuthenticated, navigate]);

  const current = useMemo(() => cards[idx], [cards, idx]);

  const submitReview = async (qualityKey) => {
    if (!current?.id || isReviewing) return;

    setError("");
    setIsReviewing(true);
    const currentIndex = idx;
    const nextIndex = Math.min(currentIndex + 1, cards.length - 1);

    setExplanation("");
    setShowAnswer(false);
    setIdx(nextIndex);

    try {
      await djangoApi.post("/flashcards/review/", {
        card_id: current.id,
        quality: qualityMap[qualityKey],
      });
    } catch (err) {
      console.error("Submit flashcard review failed", err);
      setIdx(currentIndex);
      setError(getApiErrorMessage(err, "Failed to save review. Please try again."));
    } finally {
      setIsReviewing(false);
    }
  };

  const explainCurrent = async () => {
    if (!current || isExplaining) return;
    setError("");
    setIsExplaining(true);
    try {
      const res = await djangoApi.post("/flashcards/explain/", {
        question: current.question,
        answer: current.answer,
      });
      setExplanation(res.data?.explanation || "No explanation available.");
    } catch (err) {
      console.error("Explain flashcard failed", err);
      setError(getApiErrorMessage(err, "Failed to generate explanation."));
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="fc-page">
        <section className="fc-study-layout">
          <div className="fc-panel fc-study-main">
            <div className="fc-header-row">
              <h1>Study Mode</h1>
              <button className="fc-secondary" onClick={() => navigate(`/flashcards/deck/${id}`)}>Back to Deck</button>
            </div>

            {!cards.length && <p className="fc-empty">No cards to study.</p>}
            {!!error && <p className="fc-error">{error}</p>}

            {!!cards.length && current && (
              <>
                <p className="fc-progress">Card {idx + 1} / {cards.length}</p>
                <article className="fc-study-card">
                  <h3>{current.question}</h3>
                  {showAnswer && <p>{current.answer}</p>}
                </article>

                {!showAnswer ? (
                  <button className="fc-primary" onClick={() => setShowAnswer(true)}>Show Answer</button>
                ) : (
                  <>
                    <div className="fc-actions" style={{ marginBottom: 10 }}>
                      <button className="fc-secondary" onClick={explainCurrent} disabled={isExplaining}>
                        {isExplaining ? "Explaining..." : "Explain This Card"}
                      </button>
                    </div>
                    {explanation && (
                      <div className="fc-explain-box">
                        <strong>Explanation</strong>
                        <p>{explanation}</p>
                      </div>
                    )}
                    <p className="fc-info">How well did you remember?</p>
                    <div className="fc-actions stretch">
                      <button className="fc-danger" onClick={() => submitReview("again")} disabled={isReviewing}>Again</button>
                      <button className="fc-secondary" onClick={() => submitReview("hard")} disabled={isReviewing}>Hard</button>
                      <button className="fc-secondary" onClick={() => submitReview("good")} disabled={isReviewing}>Good</button>
                      <button className="fc-primary" onClick={() => submitReview("easy")} disabled={isReviewing}>Easy</button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <aside className="fc-panel fc-study-side">
            <h3>Study Tips</h3>
            <ul>
              <li>Try recalling before revealing the answer.</li>
              <li>Use Again/Hard honestly for stronger retention.</li>
              <li>Review due cards daily to build consistency.</li>
            </ul>
          </aside>
        </section>
      </main>
    </>
  );
}
