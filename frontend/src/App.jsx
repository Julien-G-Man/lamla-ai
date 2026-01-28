import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy, useState } from "react";
import "./App.css";
import { DJANGO_WARMUP_ENDPOINT } from "./services/api";
import { FASTAPI_HEALTH_ENDPOINT } from "./services/api";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CustomQuiz = lazy(() => import("./pages/CustomQuiz"));
const Quiz = lazy(() => import("./pages/Quiz"));
const QuizResults = lazy(() => import("./pages/QuizResults"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Delayed loading component - only shows if loading takes longer than 500ms
const DelayedLoadingFallback = () => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return showLoader ? (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      color: "#FFD600",
      fontSize: "1.2rem",
      fontWeight: "600"
    }}>
      <span>Loading...</span>
    </div>
  ) : null;
};

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
      <Suspense fallback={<DelayedLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/custom-quiz" element={<CustomQuiz />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/results" element={<QuizResults />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/ai-tutor" element={<Chatbot />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
