import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { DJANGO_WARMUP_ENDPOINT, FASTAPI_HEALTH_ENDPOINT } from "./services/api";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import Dashboard from "./pages/Dashboards/Dashboard";
import AdminDashboard from "./pages/Dashboards/AdminDashboard";
import CreateQuiz from "./pages/Quiz/CreateQuiz";
import Quiz from "./pages/Quiz/Quiz";
import QuizResults from "./pages/Quiz/QuizResults";
import FlashcardDecks from "./pages/Flashcards/FlashcardDecks";
import FlashcardCreate from "./pages/Flashcards/FlashcardCreate";
import FlashcardDeck from "./pages/Flashcards/FlashcardDeck";
import FlashcardStudy from "./pages/Flashcards/FlashcardStudy";
import Chatbot from "./pages/Chatbot/Chatbot";
import Profile from "./pages/UserProfile/Profile";
import NotFound from "./pages/NotFound/NotFound";

const WAKE_INTERVAL_MS = 10 * 60 * 1000;

function App() {
  useEffect(() => {
    const wakeServices = async () => {
      await Promise.allSettled([
        fetch(DJANGO_WARMUP_ENDPOINT, { method: "GET", credentials: "omit" }),
        fetch(FASTAPI_HEALTH_ENDPOINT, { method: "GET", credentials: "omit" }),
      ]);
    };

    wakeServices();
    const intervalId = setInterval(wakeServices, WAKE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />

            <Route path="/auth" element={<Navigate to="/auth/login" replace />} />
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
            <Route path="/verify-email" element={<Navigate to="/auth/verify-email" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/quiz/create" element={<CreateQuiz />} />
            <Route path="/quiz/play" element={<Quiz />} />
            <Route path="/quiz/results" element={<QuizResults />} />
            <Route path="/quiz" element={<Navigate to="/quiz/create" replace />} />

            <Route path="/flashcards" element={<FlashcardDecks />} />
            <Route path="/flashcards/create" element={<FlashcardCreate />} />
            <Route path="/flashcards/deck/:id" element={<FlashcardDeck />} />
            <Route path="/flashcards/study/:id" element={<FlashcardStudy />} />
            <Route path="/flashcard" element={<Navigate to="/flashcards" replace />} />

            <Route path="/ai-tutor" element={<Chatbot />} />
            <Route path="/chatbot" element={<Navigate to="/ai-tutor" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
