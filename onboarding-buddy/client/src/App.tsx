import React, { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { SetupGuideViewer } from './components/SetupGuideViewer';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';

type Tab = 'chat' | 'guides' | 'architecture';

function App() {
  const getInitialTab = (): Tab => {
    const hash = window.location.hash.slice(1) as Tab;
    return ['chat', 'guides', 'architecture'].includes(hash) ? hash : 'chat';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as Tab;
      if (['chat', 'guides', 'architecture'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="d-flex flex-column vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container-fluid">
          <a href="#chat" className="navbar-brand">
            Onboarding Buddy
          </a>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a
                href="#chat"
                className={`nav-link ${activeTab === 'chat' ? 'active' : ''}`}
              >
                Chat
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#guides"
                className={`nav-link ${activeTab === 'guides' ? 'active' : ''}`}
              >
                Setup Guides
              </a>
            </li>
            <li className="nav-item">
              <a
                href="#architecture"
                className={`nav-link ${activeTab === 'architecture' ? 'active' : ''}`}
              >
                Architecture
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <div className="flex-grow-1">
        {activeTab === 'chat' && <ChatWindow />}
        {activeTab === 'guides' && <SetupGuideViewer />}
        {activeTab === 'architecture' && <ArchitectureExplorer />}
      </div>
    </div>
  );
}

export default App;
