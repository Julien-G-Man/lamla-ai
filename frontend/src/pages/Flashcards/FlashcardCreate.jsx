import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import djangoApi from "../../services/api";
import "./Flashcards.css";

const SUBJECT_OPTIONS = [
  "Computer Science",
  "Mathematics",
  "Engineering",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "History",
  "Programming",
  "Artificial Intelligence",
  "Other",
];

const normalizeCards = (rawCards) => {
  if (Array.isArray(rawCards)) {
    return rawCards
      .map((item) => ({
        question: item.question || item.front || "",
        answer: item.answer || item.back || "",
      }))
      .filter((item) => item.question && item.answer);
  }

  if (typeof rawCards === "string") {
    try {
      return normalizeCards(JSON.parse(rawCards));
    } catch {
      return [];
    }
  }

  return [];
};

const buildFallbackCards = (text, subject, count) => {
  const safeSubject = (subject || "the topic").trim() || "the topic";
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  const chunks = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const source = chunks.length ? chunks : [normalized || "No source text provided."];
  const max = Math.max(1, Math.min(Number(count) || 10, 25));
  return Array.from({ length: max }, (_, idx) => ({
    question: `Key point ${idx + 1} in ${safeSubject}?`,
    answer: source[idx % source.length].slice(0, 320),
  }));
};

export default function FlashcardCreate() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [cards, setCards] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [info, setInfo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileNameDisplay, setFileNameDisplay] = useState("");
  const [activeTab, setActiveTab] = useState("fileContent");

  const fileRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth/login");
  }, [isAuthenticated, navigate]);

  const finalSubject = useMemo(
    () => (subject === "Other" ? customSubject.trim() : subject.trim()),
    [subject, customSubject]
  );

  const extractText = async (file) => {
    if (!file) return;

    setInfo("");
    setIsExtracting(true);
    setFileNameDisplay(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    const formData = new FormData();
    formData.append("slide_file", file);

    try {
      const res = await djangoApi.post("/flashcards/ajax-extract-text/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setText(res.data?.text || "");
      setActiveTab("textContent");
      setInfo("Text extracted successfully.");
    } catch (err) {
      console.error("Flashcard text extraction failed", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    setInfo("");

    if (!finalSubject || text.trim().length < 30) {
      console.error("Generate validation failed", { finalSubject, textLength: text.trim().length });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await djangoApi.post("/flashcards/generate/", {
        subject: finalSubject,
        text,
        prompt: prompt.trim(),
        num_cards: Number(numCards),
        difficulty,
      });

      const generated = normalizeCards(res.data?.cards);
      const safeCards = generated.length ? generated : buildFallbackCards(text, finalSubject, numCards);
      setCards(safeCards);

      if (res.data?.fallback_used) {
        setInfo("Fallback flashcards generated.");
      } else {
        setInfo(`Generated ${safeCards.length} flashcards.`);
      }
    } catch (err) {
      console.error("Flashcard generation failed", err);
      setCards(buildFallbackCards(text, finalSubject, numCards));
      setInfo("Fallback flashcards generated.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDeck = async () => {
    if (!cards.length) return;
    setIsSaving(true);

    try {
      const res = await djangoApi.post("/flashcards/save/", {
        subject: finalSubject || "Flashcards",
        cards,
      });
      const deckId = res.data?.deck_id;
      if (deckId) navigate(`/flashcards/deck/${deckId}`);
    } catch (err) {
      console.error("Save flashcard deck failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="fc-page">
        <section className="fc-create-layout">
          <article className="fc-panel fc-create-form">
            <div className="fc-header-row">
              <h1>Create Flashcards</h1>
              <button className="fc-secondary" onClick={() => navigate("/flashcards")}>Back to Decks</button>
            </div>

            <form className="fc-form" onSubmit={generate}>
              <label>Subject / Topic</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">Select subject</option>
                {SUBJECT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {subject === "Other" && (
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Custom subject"
                />
              )}

              <div className="tab-group fc-tab-group-like-cq">
                <button
                  type="button"
                  className={`tab ${activeTab === "textContent" ? "active" : ""}`}
                  onClick={() => setActiveTab("textContent")}
                >
                  Enter Text
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === "fileContent" ? "active" : ""}`}
                  onClick={() => setActiveTab("fileContent")}
                >
                  Upload File
                </button>
              </div>

              {activeTab === "textContent" && (
                <div className="tab-content active slide-in fc-tab-content-like-cq">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Extracted text appears here (editable)"
                  />
                </div>
              )}

              {activeTab === "fileContent" && (
                <div className="tab-content active slide-in fc-tab-content-like-cq">
                  <div
                    className={`upload-zone fc-upload-zone-like-cq ${dragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) extractText(file);
                    }}
                  >
                    <div className="upload-icon">PDF</div>
                    <div className="upload-text">Upload your study materials</div>
                    <div className="upload-description">PDF, DOCX, PPTX, or TXT</div>

                    <input
                      ref={fileRef}
                      className="hidden-file-input"
                      type="file"
                      accept=".pdf,.docx,.pptx,.txt"
                      onChange={(e) => extractText(e.target.files?.[0])}
                    />

                    <button
                      type="button"
                      className="select-file-button"
                      onClick={() => fileRef.current?.click()}
                      disabled={isExtracting}
                    >
                      {isExtracting ? "Extracting..." : "Select file"}
                    </button>

                    {fileNameDisplay && <span className="file-name-display">{fileNameDisplay}</span>}
                  </div>
                </div>
              )}

              <label>Custom Prompt (optional)</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Extra instructions for AI" />

              <div className="fc-row two">
                <div>
                  <label>Number of cards</label>
                  <input type="number" min="1" max="25" value={numCards} onChange={(e) => setNumCards(e.target.value)} />
                </div>
                <div>
                  <label>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
              </div>

              <button className="fc-primary" type="submit" disabled={isGenerating || isExtracting}>
                {isGenerating ? "Generating..." : "Generate Flashcards"}
              </button>
            </form>

            {info && <p className="fc-info">{info}</p>}
          </article>

          <aside className="fc-panel fc-preview-panel">
            <h2>Preview</h2>
            {!cards.length && <p className="fc-muted">Generated flashcards will appear here.</p>}

            <div className="fc-preview-list">
              {cards.map((card, idx) => (
                <article key={`${idx}-${card.question}`} className="fc-preview-item">
                  <p><strong>Q:</strong> {card.question}</p>
                  <p><strong>A:</strong> {card.answer}</p>
                </article>
              ))}
            </div>

            {!!cards.length && (
              <button className="fc-primary" onClick={saveDeck} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Deck"}
              </button>
            )}
          </aside>
        </section>
      </main>
    </>
  );
}
