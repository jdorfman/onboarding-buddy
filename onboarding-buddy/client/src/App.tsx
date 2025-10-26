import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import { ChatWindow } from './components/ChatWindow';
import { SetupGuideViewer } from './components/SetupGuideViewer';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column vh-100">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
          <div className="container-fluid">
            <Link to="/" className="navbar-brand">
              Onboarding Buddy
            </Link>
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
                  to="/architecture"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Architecture
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<ChatWindow />} />
            <Route path="/guides" element={<SetupGuideViewer />} />
            <Route path="/guides/:guideId" element={<SetupGuideViewer />} />
            <Route path="/architecture" element={<ArchitectureExplorer />} />
            <Route path="/chat/:chatId" element={<ChatWindow />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
