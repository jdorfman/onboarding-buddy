import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';

interface Question {
  id: string;
  text: string;
  correct_answer: boolean;
  explanation: string;
  source_message_id: number | null;
  guide_refs: { guideId: string; section?: string }[] | null;
}

interface Quiz {
  id: string;
  title: string;
  source_chat_id: string;
  questions: Question[];
}

interface QuizResult {
  questionId: string;
  selected: boolean | null;
  correct_answer: boolean;
  is_correct: boolean;
  explanation: string;
  source_message_id: number | null;
  guide_refs: any[] | null;
}

export const QuizRunner: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<QuizResult[] | null>(null);
  const [score, setScore] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    if (!quizId) return;

    try {
      const response = await quizAPI.getById(quizId);
      setQuiz(response.data);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      alert('Failed to load quiz');
      navigate('/quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const allAnswered = quiz.questions.every(q => answers[q.id] !== undefined);
    if (!allAnswered) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      const answerArray = quiz.questions.map(q => ({
        questionId: q.id,
        selected: answers[q.id]
      }));

      const response = await quizAPI.grade(quiz.id, answerArray);
      setResults(response.data.results);
      setScore({ score: response.data.score, total: response.data.total });
    } catch (error) {
      console.error('Failed to grade quiz:', error);
      alert('Failed to grade quiz. Please try again.');
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResults(null);
    setScore(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (!quiz) {
    return (
      <div className="container mt-5 text-center">
        <h4>Quiz not found</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/quiz')}>
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{quiz.title}</h2>
          <p className="text-muted">{quiz.questions.length} questions</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/quiz')}>
          Back to Quizzes
        </button>
      </div>

      {score && (
        <div className={`alert ${score.score === score.total ? 'alert-success' : 'alert-info'} mb-4`}>
          <h4 className="alert-heading">
            {score.score === score.total ? '🎉 Perfect Score!' : 'Quiz Complete!'}
          </h4>
          <p className="mb-0">
            You scored <strong>{score.score}</strong> out of <strong>{score.total}</strong> ({Math.round((score.score / score.total) * 100)}%)
          </p>
        </div>
      )}

      <div className="quiz-questions">
        {quiz.questions.map((question, index) => {
          const result = results?.find(r => r.questionId === question.id);
          const isAnswered = answers[question.id] !== undefined;

          return (
            <div key={question.id} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0">
                    Question {index + 1}
                  </h5>
                  {result && (
                    <span className={`badge ${result.is_correct ? 'bg-success' : 'bg-danger'}`}>
                      {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  )}
                </div>

                <p className="card-text fs-5 mb-3">{question.text}</p>

                <div className="btn-group w-100 mb-3" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name={`question-${question.id}`}
                    id={`${question.id}-true`}
                    checked={answers[question.id] === true}
                    onChange={() => handleAnswerChange(question.id, true)}
                    disabled={!!results}
                  />
                  <label
                    className={`btn ${results ? (result?.correct_answer === true ? 'btn-success' : 'btn-outline-secondary') : 'btn-outline-primary'}`}
                    htmlFor={`${question.id}-true`}
                  >
                    True
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name={`question-${question.id}`}
                    id={`${question.id}-false`}
                    checked={answers[question.id] === false}
                    onChange={() => handleAnswerChange(question.id, false)}
                    disabled={!!results}
                  />
                  <label
                    className={`btn ${results ? (result?.correct_answer === false ? 'btn-success' : 'btn-outline-secondary') : 'btn-outline-primary'}`}
                    htmlFor={`${question.id}-false`}
                  >
                    False
                  </label>
                </div>

                {result && (
                  <div className="mt-3">
                    <div className="alert alert-light mb-2">
                      <strong>Explanation:</strong> {result.explanation}
                    </div>
                    <div className="d-flex gap-2">
                      {quiz.source_chat_id && result.source_message_id && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/chat/${quiz.source_chat_id}`)}
                        >
                          View Source Answer
                        </button>
                      )}
                      {result.guide_refs && result.guide_refs.length > 0 && (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => navigate(`/guides/${result.guide_refs![0].guideId}`)}
                        >
                          Read Guide
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="d-flex gap-2 justify-content-end mt-4">
        {!results ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={quiz.questions.some(q => answers[q.id] === undefined)}
          >
            Submit Quiz
          </button>
        ) : (
          <button className="btn btn-secondary btn-lg" onClick={handleRetry}>
            Retry Quiz
          </button>
        )}
      </div>
    </div>
  );
};
