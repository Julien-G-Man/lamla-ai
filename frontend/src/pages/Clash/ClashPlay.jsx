import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "./Clash.css";

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL;
const DJANGO_ROOT_URL = DJANGO_API_URL.replace(/\/api\/?$/, "");
const LETTERS = ["A", "B", "C", "D", "E"];

function buildWsUrl(code, token) {
  const proto = DJANGO_ROOT_URL.startsWith("https") ? "wss" : "ws";
  const host = DJANGO_ROOT_URL.replace(/^https?:\/\//, "");
  return `${proto}://${host}/ws/clash/${code}/?token=${token}`;
}

function medalClass(rank) {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "";
}

// phase: 'connecting' | 'countdown' | 'question' | 'answered' | 'reveal'

export default function ClashPlay() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("auth_token");
  const userRaw = localStorage.getItem("user");
  const currentUser = userRaw ? JSON.parse(userRaw) : null;
  const myId = currentUser ? String(currentUser.id) : null;

  const [timePerQuestion, setTimePerQuestion] = useState(
    location.state?.timePerQuestion ?? 20
  );

  const [phase, setPhase] = useState("connecting");
  const [countdown, setCountdown] = useState(null);

  const [qIndex, setQIndex] = useState(0);
  const [qTotal, setQTotal] = useState(0);
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState([]);

  const [timeLimit, setTimeLimit] = useState(20);
  const [timeRemaining, setTimeRemaining] = useState(20);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [reveal, setReveal] = useState(null);

  // Persistent standings — updated on question_ended, never cleared
  const [standings, setStandings] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [myRank, setMyRank] = useState(null);

  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const answerStartRef = useRef(null);
  const phaseRef = useRef("connecting");

  function startTimer(totalSecs, remainingSecs) {
    clearInterval(timerRef.current);
    setTimeLimit(totalSecs);
    setTimeRemaining(remainingSecs);
    const start = Date.now();
    const startRemaining = remainingSecs;
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, startRemaining - elapsed);
      setTimeRemaining(left);
      if (left <= 0) clearInterval(timerRef.current);
    }, 100);
  }

  // Fetch room meta if not passed via nav state
  useEffect(() => {
    if (!token) { navigate("/auth/login"); return; }
    if (location.state?.timePerQuestion) return;
    fetch(`${DJANGO_API_URL}/clash/${code}/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (data.time_per_question) setTimePerQuestion(data.time_per_question); })
      .catch(() => {});
  }, []); // eslint-disable-line

  // WebSocket
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(buildWsUrl(code, token));
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }

      switch (msg.type) {

        case "clash.game_starting": {
          let rem = msg.countdown ?? 3;
          setPhase("countdown"); phaseRef.current = "countdown";
          setCountdown(rem);
          const iv = setInterval(() => {
            rem -= 1;
            setCountdown(rem);
            if (rem <= 0) {
              clearInterval(iv);
              setPhase("connecting"); phaseRef.current = "connecting";
            }
          }, 1000);
          break;
        }

        case "clash.new_question":
        case "game_catchup": {
          clearInterval(timerRef.current);
          setQIndex(msg.index);
          setQTotal(msg.total);
          setQText(msg.question);
          setQOptions(msg.options || []);
          setSelectedAnswer(null);
          setFeedback(null);
          setReveal(null);
          setPhase("question"); phaseRef.current = "question";
          answerStartRef.current = Date.now();

          if (msg.type === "game_catchup") {
            const tpq = msg.time_limit ?? timePerQuestion;
            startTimer(tpq, msg.time_remaining);
          } else {
            const serverElapsed = msg.server_time
              ? Math.max(0, Date.now() / 1000 - msg.server_time)
              : 0;
            const tpq = msg.time_limit ?? timePerQuestion;
            startTimer(tpq, Math.max(0, tpq - serverElapsed));
          }
          break;
        }

        case "answer_confirmed": {
          setFeedback(msg);
          setMyScore(msg.total_score);
          setPhase("answered"); phaseRef.current = "answered";
          break;
        }

        case "clash.question_ended": {
          clearInterval(timerRef.current);
          setReveal(msg);
          setStandings(msg.top3 || []);
          setPhase("reveal"); phaseRef.current = "reveal";

          if (myId && msg.your_scores) {
            const sorted = Object.entries(msg.your_scores).sort(([, a], [, b]) => b - a);
            const idx = sorted.findIndex(([uid]) => uid === myId);
            if (idx >= 0) setMyRank(idx + 1);
          }
          break;
        }

        case "clash.game_finished": {
          clearInterval(timerRef.current);
          navigate(`/clash/results/${code}`, { state: { rankings: msg.rankings } });
          break;
        }

        default: break;
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};

    return () => {
      clearInterval(timerRef.current);
      ws.close();
    };
  }, [token, code]); // eslint-disable-line

  function submitAnswer(answer) {
    if (phaseRef.current !== "question") return;
    const elapsed_ms = answerStartRef.current ? Math.round(Date.now() - answerStartRef.current) : 0;
    setSelectedAnswer(answer);
    setPhase("answered"); phaseRef.current = "answered";
    wsRef.current?.send(JSON.stringify({ type: "submit_answer", question_index: qIndex, answer, elapsed_ms }));
  }

  const timerPct = timeLimit > 0 ? Math.min(100, (timeRemaining / timeLimit) * 100) : 0;
  const timerClass = timerPct <= 15 ? "danger" : timerPct <= 33 ? "warning" : "";
  const timerSecs = Math.ceil(timeRemaining);
  const correctAns = reveal?.correct_answer ?? feedback?.correct_answer;
  const showReveal = phase === "reveal" || (phase === "answered" && feedback);
  const myOutsideTop3 = myRank && myRank > 3;

  // ── Connecting ──
  if (phase === "connecting") {
    return (
      <>
        <Navbar />
        <div className="clash-play-page clash-center-screen">
          <div className="clash-spinner" />
          <p>Connecting to room…</p>
        </div>
      </>
    );
  }

  // ── Countdown ──
  if (phase === "countdown") {
    return (
      <>
        <Navbar />
        <div className="clash-play-page clash-center-screen">
          <div className="clash-countdown-num">{countdown}</div>
          <p className="clash-countdown-label">Get ready</p>
        </div>
      </>
    );
  }

  // ── Active game ──
  return (
    <>
    <Navbar />
    <div className="clash-play-page">

      {/* Timer */}
      <div className="clash-timer-row">
        <div className="clash-timer-bar-wrap">
          <div className={`clash-timer-bar-fill ${timerClass}`} style={{ width: `${timerPct}%` }} />
        </div>
        <span className={`clash-timer-num ${timerClass}`}>{timerSecs}s</span>
      </div>
      <p className="clash-progress-label">Question {qIndex + 1} of {qTotal}</p>

      {/* 2-column layout: main + sidebar */}
      <div className="clash-play-layout">

        {/* ── Main column ── */}
        <div className="clash-play-main">

          <div className="clash-question-card">
            <p className="clash-question-text">{qText}</p>
          </div>

          <div className="clash-options-grid">
            {qOptions.map((opt, i) => {
              let cls = "clash-option-btn";
              if (showReveal && correctAns) {
                if (opt === correctAns)               cls += " correct";
                else if (opt === selectedAnswer)      cls += " incorrect";
              } else if (opt === selectedAnswer) {
                cls += " selected";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={phase !== "question"}
                  onClick={() => submitAnswer(opt)}
                >
                  <span className="clash-option-letter">{LETTERS[i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Answer feedback */}
          {feedback && (
            <div className={`clash-answer-feedback ${feedback.correct ? "correct" : "incorrect"}`}>
              <span className="clash-feedback-verdict">
                {feedback.correct ? "Correct" : "Incorrect"}
              </span>
              <span className="clash-feedback-score">
                {feedback.correct ? `+${feedback.points_earned} pts` : "No points"}
                {" · "}Total: {feedback.total_score}
              </span>
            </div>
          )}

          {/* Explanation */}
          {phase === "reveal" && reveal?.explanation && (
            <div className="clash-explanation">
              <strong>Explanation: </strong>{reveal.explanation}
            </div>
          )}

          {/* Waiting */}
          {phase === "answered" && !reveal && (
            <p className="clash-waiting-answers">Waiting for other players…</p>
          )}
        </div>

        {/* ── Sidebar: standings ── */}
        <div className="clash-play-sidebar">
          <div className="clash-mini-leaderboard">
            <p className="clash-mini-leaderboard-title">Standings</p>

            {standings.length === 0 && (
              <p className="clash-mini-empty">Scores appear after each round</p>
            )}

            {standings.map(entry => (
              <div key={entry.user_id} className="clash-mini-row">
                <div className={`clash-rank-badge ${medalClass(entry.rank)}`}>{entry.rank}</div>
                <span className="clash-mini-name">{entry.display_name}</span>
                {entry.user_id === myId && <span className="clash-mini-you-tag">you</span>}
                <span className="clash-mini-score">{entry.score}</span>
              </div>
            ))}

            {/* My row if outside top 3 */}
            {myOutsideTop3 && standings.length > 0 && (
              <>
                <div className="clash-mini-row-divider" />
                <div className="clash-mini-row">
                  <div className="clash-rank-badge">{myRank}</div>
                  <span className="clash-mini-name">You</span>
                  <span className="clash-mini-you-tag">you</span>
                  <span className="clash-mini-score">{myScore}</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
