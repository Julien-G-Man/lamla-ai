import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { DJANGO_WARMUP_ENDPOINT, FASTAPI_HEALTH_ENDPOINT } from "./services/api";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import CustomQuiz from "./pages/CustomQuiz/CustomQuiz";
import Quiz from "./pages/Quiz/Quiz";
import QuizResults from "./pages/QuizResults/QuizResults";
import Flashcards from "./pages/Flashcards/Flashcards";
import Chatbot from "./pages/Chatbot/Chatbot";
import NotFound from "./pages/NotFound/NotFound";

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
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/custom-quiz" element={<CustomQuiz />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/results" element={<QuizResults />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/ai-tutor" element={<Chatbot />} />
            {/* Catch-all route for 404s */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
