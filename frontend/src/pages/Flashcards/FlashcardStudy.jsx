import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import djangoApi from "../../services/api";
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    const load = async () => {
      try {
        const res = await djangoApi.get(`/flashcards/deck/${id}/`);
        setCards(res.data?.cards || []);
        setIdx(0);
      } catch (err) {
        console.error("Load study deck failed", err);
      }
    };

    load();
  }, [id, isAuthenticated, navigate]);

  const current = useMemo(() => cards[idx], [cards, idx]);

  const submitReview = async (qualityKey) => {
    if (!current?.id) return;

    try {
      await djangoApi.post("/flashcards/review/", {
        card_id: current.id,
        quality: qualityMap[qualityKey],
      });

      setShowAnswer(false);
      setIdx((prev) => Math.min(prev + 1, cards.length - 1));
    } catch (err) {
      console.error("Submit flashcard review failed", err);
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
                    <p className="fc-info">How well did you remember?</p>
                    <div className="fc-actions stretch">
                      <button className="fc-danger" onClick={() => submitReview("again")}>Again</button>
                      <button className="fc-secondary" onClick={() => submitReview("hard")}>Hard</button>
                      <button className="fc-secondary" onClick={() => submitReview("good")}>Good</button>
                      <button className="fc-primary" onClick={() => submitReview("easy")}>Easy</button>
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
