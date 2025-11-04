import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { ChatWindow } from './components/ChatWindow';
import { SetupGuideViewer } from './components/SetupGuideViewer';
import { QuizListPage } from './components/QuizListPage';
import { QuizRunner } from './components/QuizRunner';

function App() {
return (
<AuthProvider>
<BrowserRouter>
<div className="d-flex flex-column vh-100">
<Navbar />

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
</AuthProvider>
);
}

export default App;
