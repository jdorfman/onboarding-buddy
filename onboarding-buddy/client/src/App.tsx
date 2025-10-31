import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { ChatWindow } from './components/ChatWindow';
import { SetupGuideViewer } from './components/SetupGuideViewer';
import { QuizListPage } from './components/QuizListPage';
import { QuizRunner } from './components/QuizRunner';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <Link to="/" className="navbar-brand">
              Onboarding Buddy
            </Link>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <NavLink
                    to="/"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    end
                  >
                    Chat
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/guides"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Setup Guides
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/quiz"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Quiz
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<ChatWindow />} />
            <Route path="/guides" element={<SetupGuideViewer />} />
            <Route path="/guides/:guideId" element={<SetupGuideViewer />} />
            <Route path="/chat/:chatId" element={<ChatWindow />} />
            <Route path="/quiz" element={<QuizListPage />} />
            <Route path="/quiz/:quizId" element={<QuizRunner />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
