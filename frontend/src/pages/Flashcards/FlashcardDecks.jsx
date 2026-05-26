import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/AppShell/AppShell";
import { useAuth } from "../../context/AuthContext";
import djangoApi from "../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faLayerGroup, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../Dashboards/Dashboard.css";

export default function FlashcardDecks() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await djangoApi.get("/flashcards/decks/");
      setDecks(res.data?.decks || []);
    } catch (err) {
      console.error("Load flashcard decks failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    loadDecks();
  }, [isAuthenticated, navigate, loadDecks]);

  const handleDelete = async (deckId) => {
    if (!window.confirm("Delete this deck?")) return;
    try {
      await djangoApi.delete(`/flashcards/decks/${deckId}/`);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (err) {
      console.error("Delete flashcard deck failed", err);
    }
  };

  const totalDue = decks.reduce((sum, d) => sum + (d.due_today || 0), 0);

  return (
    <AppShell>
      <main className="db-main">
        <div className="db-tab">

          <div className="db-page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1>Flashcard Decks</h1>
              <p>Build and review decks with a daily due-card loop.</p>
            </div>
            <button className="db-btn db-btn-primary" onClick={() => navigate("/flashcards/create")}>
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 6 }} />
              Create Deck
            </button>
          </div>

          <div className="db-card">
            <div className="db-card-header">
              <h2>Your Decks</h2>
              {!loading && decks.length > 0 && (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>
                    {decks.length} deck{decks.length !== 1 ? "s" : ""}
                  </span>
                  {totalDue > 0 && (
                    <span style={{ fontSize: 13, color: "var(--primary-color)", fontWeight: 600 }}>
                      {totalDue} due today
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="db-empty"><p>Loading decks…</p></div>
            ) : !decks.length ? (
              <div className="db-empty">
                <div className="db-empty-icon"><FontAwesomeIcon icon={faLayerGroup} /></div>
                <p>No decks yet. Create your first deck to get started.</p>
                <button className="db-btn db-btn-primary" onClick={() => navigate("/flashcards/create")}>
                  Create Deck
                </button>
              </div>
            ) : (
              <div className="db-activity-list">
                {decks.map((deck) => (
                  <div className="db-activity-item" key={deck.id}>
                    <div className="db-activity-dot">
                      <FontAwesomeIcon icon={faLayerGroup} />
                    </div>
                    <div className="db-activity-body">
                      <p>{deck.title}</p>
                      <span>
                        {deck.card_count || 0} card{(deck.card_count || 0) !== 1 ? "s" : ""}
                        {deck.due_today > 0 ? ` · ${deck.due_today} due today` : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button className="db-btn db-btn-primary db-btn-sm" onClick={() => navigate(`/flashcards/study/${deck.id}`)}>
                        Study
                      </button>
                      <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => navigate(`/flashcards/deck/${deck.id}`)}>
                        View
                      </button>
                      <button className="db-btn db-btn-danger db-btn-sm" onClick={() => handleDelete(deck.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </AppShell>
  );
}
