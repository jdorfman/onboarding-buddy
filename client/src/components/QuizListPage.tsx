import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { quizAPI, questionAPI } from '../services/api';

interface Quiz {
  id: string;
  title: string;
  source_chat_id: string;
  chat_title: string;
  question_count: number;
  created_at: string;
}

interface ChatSession {
  id: string;
  title: string;
  first_question: string;
}

export const QuizListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromChat = searchParams.get('fromChat');

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(!!fromChat);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState(fromChat || '');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadQuizzes();
    loadChatSessions();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await quizAPI.getAll();
      setQuizzes(response.data);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatSessions = async () => {
    try {
      const response = await questionAPI.getAllChats();
      setChatSessions(response.data);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedChatId) return;

    setIsGenerating(true);
    try {
      const response = await quizAPI.generate(selectedChatId, questionCount);
      setShowGenerateModal(false);
      await loadQuizzes();
      navigate(`/quiz/${response.data.id}`);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuiz = async (id: string, title: string) => {
    if (!confirm(`Delete quiz "${title}"?`)) return;

    try {
      await quizAPI.delete(id);
      await loadQuizzes();
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quizzes</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowGenerateModal(true)}
        >
          + Generate Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center text-muted mt-5">
          <h4>No quizzes yet</h4>
          <p>Generate a quiz from your chat conversations to test your knowledge!</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => setShowGenerateModal(true)}
          >
            Generate Your First Quiz
          </button>
        </div>
      ) : (
        <div className="row">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{quiz.title}</h5>
                  {quiz.chat_title && (
                    <p className="card-text text-muted small">
                      Source: {quiz.chat_title}
                    </p>
                  )}
                  <p className="card-text">
                    <span className="badge bg-secondary">{quiz.question_count} questions</span>
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </small>
                  </p>
                </div>
                <div className="card-footer bg-transparent d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm flex-grow-1"
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    Take Quiz
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGenerateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Generate Quiz</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="chatSelect" className="form-label">Select Chat Session</label>
                  <select 
                    id="chatSelect"
                    className="form-select"
                    value={selectedChatId}
                    onChange={(e) => setSelectedChatId(e.target.value)}
                    disabled={isGenerating}
                  >
                    <option value="">Choose a chat...</option>
                    {chatSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.title || session.first_question || 'Untitled Chat'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="questionCount" className="form-label">
                    Number of Questions: {questionCount}
                  </label>
                  <input 
                    type="range"
                    className="form-range"
                    id="questionCount"
                    min="3"
                    max="10"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    disabled={isGenerating}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleGenerateQuiz}
                  disabled={!selectedChatId || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Generating...
                    </>
                  ) : (
                    'Generate Quiz'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
