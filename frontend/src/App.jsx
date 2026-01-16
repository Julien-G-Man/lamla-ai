import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CustomQuiz from "./pages/CustomQuiz";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import Flashcards from "./pages/Flashcards";
import Chatbot from "./pages/Chatbot";
import About from "./pages/About";
import './App.css';

function App() {
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
