import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import djangoApi from "../../services/api";
import "./flashcards.css";

export default function FlashcardDeck() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await djangoApi.get(`/flashcards/deck/${id}/`);
        setCards(res.data?.cards || []);
      } catch (err) {
        console.error("Load flashcard deck failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isAuthenticated, navigate]);

  const deleteDeck = async () => {
    if (!window.confirm("Delete this deck?")) return;
    try {
      await djangoApi.delete(`/flashcards/deck/${id}/`);
      navigate("/flashcards");
    } catch (err) {
      console.error("Delete flashcard deck failed", err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="fc-page">
        <section className="fc-hero compact">
          <div>
            <h1>Deck Details</h1>
            <p>{cards.length} cards in this deck</p>
          </div>
          <div className="fc-actions">
            <button className="fc-primary" onClick={() => navigate(`/flashcards/study/${id}`)}>Study Deck</button>
            <button className="fc-danger" onClick={deleteDeck}>Delete Deck</button>
          </div>
        </section>

        {loading && <p className="fc-muted">Loading cards...</p>}
        {!loading && !cards.length && <p className="fc-empty">No cards in this deck.</p>}

        <section className="fc-grid deck-detail-grid">
          {cards.map((card) => (
            <article key={card.id} className="fc-panel fc-qa">
              <h4>{card.question}</h4>
              <p>{card.answer}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
