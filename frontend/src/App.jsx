import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CustomQuiz from "./pages/CustomQuiz";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import Flashcards from "./pages/Flashcards";
import Chatbot from "./pages/Chatbot";
import About from "./pages/About";

import { DJANGO_WARMUP_ENDPOINT } from "./services/api";
import { FASTAPI_HEALTH_ENDPOINT } from "./services/api";

function App() {
  useEffect(() => {

    // Wake Django
    fetch(DJANGO_WARMUP_ENDPOINT).catch(() => {});

    // Wake FastAPI
    fetch(FASTAPI_HEALTH_ENDPOINT)
      .then(res => res.json())
      .catch(err => console.warn("FastAPI not reachable: ", err));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/custom-quiz" element={<CustomQuiz />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/results" element={<QuizResults />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/ai-tutor" element={<Chatbot />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
