import React, { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { SetupGuideViewer } from './components/SetupGuideViewer';
import { ArchitectureExplorer } from './components/ArchitectureExplorer';

type Tab = 'chat' | 'guides' | 'architecture';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <div className="d-flex flex-column vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand">
            Onboarding Buddy
          </span>
          <ul className="navbar-nav">
            <li className="nav-item">
              <button
                className={`nav-link btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn ${activeTab === 'guides' ? 'active' : ''}`}
                onClick={() => setActiveTab('guides')}
              >
                Setup Guides
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn ${activeTab === 'architecture' ? 'active' : ''}`}
                onClick={() => setActiveTab('architecture')}
              >
                Architecture
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="flex-grow-1 overflow-hidden">
        {activeTab === 'chat' && <ChatWindow />}
        {activeTab === 'guides' && <SetupGuideViewer />}
        {activeTab === 'architecture' && <ArchitectureExplorer />}
      </div>
    </div>
  );
}

export default App;
