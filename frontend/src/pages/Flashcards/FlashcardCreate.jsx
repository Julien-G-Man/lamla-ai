import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import djangoApi, { getApiErrorMessage } from "../../services/api";
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
  const chunks = normalized.split(/(?<=[.!?])\s+/).map((c) => c.trim()).filter(Boolean);
  const source = chunks.length ? chunks : [normalized || "No source text provided."];
  const max = Math.max(1, Math.min(Number(count) || 10, 25));
  const toCard = (line) => {
    const sentence = (line || "").trim().replace(/\.$/, "");
    if (!sentence) {
      return {
        question: `Explain one core idea in ${safeSubject}.`,
        answer: "No source text provided.",
      };
    }

    const isPattern = sentence.match(/^([A-Za-z0-9][A-Za-z0-9 ()/-]{1,80})\s+is\s+(.+)$/i);
    if (isPattern) {
      return {
        question: `What is ${isPattern[1].trim()}?`,
        answer: isPattern[2].trim().slice(0, 320),
      };
    }

    if (sentence.includes(":")) {
      const [left, right] = sentence.split(":");
      if (left && right) {
        return {
          question: `Explain ${left.trim()} in ${safeSubject}.`,
          answer: right.trim().slice(0, 320),
        };
      }
    }

    return {
      question: `In ${safeSubject}, explain this idea: "${sentence.slice(0, 120)}"`,
      answer: sentence.slice(0, 320),
    };
  };

  return Array.from({ length: max }, (_, idx) => toCard(source[idx % source.length]));
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
  const [error, setError] = useState("");
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
    if (isExtracting) return;

    setInfo("");
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum allowed size is 10MB.");
      return;
    }

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
      setError(getApiErrorMessage(err, "Failed to extract text from file."));
    } finally {
      setIsExtracting(false);
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    if (isGenerating) return;
    setInfo("");
    setError("");

    if (!finalSubject || text.trim().length < 30) {
      setError("Please provide a subject and at least 30 characters of study text.");
      return;
    }

    const boundedNumCards = Math.max(1, Math.min(25, Number(numCards) || 10));
    if (boundedNumCards !== Number(numCards)) {
      setNumCards(boundedNumCards);
    }

    if (prompt.trim().length > 1500) {
      setError("Prompt is too long. Maximum allowed length is 1500 characters.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await djangoApi.post("/flashcards/generate/", {
        subject: finalSubject,
        text,
        prompt: prompt.trim(),
        num_cards: boundedNumCards,
        difficulty,
      });

      const generated = normalizeCards(res.data?.cards);
      const safeCards = generated.length ? generated : buildFallbackCards(text, finalSubject, boundedNumCards);
      setCards(safeCards);

      if (res.data?.fallback_used) {
        setInfo(res.data?.warning || "Fallback flashcards generated.");
      } else {
        setInfo(`Generated ${safeCards.length} flashcards.`);
      }
    } catch (err) {
      console.error("Flashcard generation failed", err);
      const message = getApiErrorMessage(err, "Flashcard generation failed.");
      const status = err?.response?.status;

      if (!status || status >= 500) {
        setCards(buildFallbackCards(text, finalSubject, boundedNumCards));
        setInfo("AI service unavailable. Fallback flashcards generated.");
      } else {
        setError(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDeck = async () => {
    if (!cards.length || isSaving) return;
    setError("");
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
      setError(getApiErrorMessage(err, "Failed to save deck."));
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
              <p className="fc-step-label">Step 1: Choose your subject</p>
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

              <p className="fc-step-label">Step 2: Add study content</p>
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

              <p className="fc-step-label">Step 3: Configure and generate</p>
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
            {error && <p className="fc-error">{error}</p>}
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
