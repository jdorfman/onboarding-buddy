import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SetupGuide } from '../types';
import { guidesAPI } from '../services/api';

export const SetupGuideViewer: React.FC = () => {
  const navigate = useNavigate();
  const { guideId } = useParams();
  const [guides, setGuides] = useState<SetupGuide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<SetupGuide | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingTopic, setGeneratingTopic] = useState('');

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const response = await guidesAPI.getAll();
      setGuides(response.data);
    } catch (error) {
      console.error('Failed to load guides:', error);
    }
  };

  const handleGenerateGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatingTopic.trim()) return;

    setIsLoading(true);
    try {
      const response = await guidesAPI.generate(generatingTopic);
      const newGuide = response.data;
      setGuides(prev => [newGuide, ...prev]);
      setSelectedGuide(newGuide);
      setGeneratingTopic('');
    } catch (error) {
      console.error('Failed to generate guide:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'danger'
    };
    return badges[difficulty as keyof typeof badges] || 'secondary';
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-md-3 border-end p-3">
          <h5>Setup Guides</h5>
          
          <form onSubmit={handleGenerateGuide} className="mb-3">
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Generate guide for..."
                value={generatingTopic}
                onChange={(e) => setGeneratingTopic(e.target.value)}
                disabled={isLoading}
              />
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? '...' : '+'}
              </button>
            </div>
          </form>

          <div className="list-group">
            {guides.map((guide) => (
              <button
                key={guide.id}
                className={`list-group-item list-group-item-action ${selectedGuide?.id === guide.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedGuide(guide);
                  navigate(`/guides/${guide.id}`);
                }}
              >
                <div className="d-flex w-100 justify-content-between align-items-center">
                  <h6 className="mb-1">{guide.title}</h6>
                  <span className={`badge bg-${getDifficultyBadge(guide.difficulty)} flex-shrink-0`}>
                    {guide.difficulty}
                  </span>
                </div>
                <small>{guide.estimatedTime}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="col-md-9 p-4 overflow-auto">
          {selectedGuide ? (
            <>
              <h2>{selectedGuide.title}</h2>
              <div className="d-flex gap-2 mb-3">
                <span className={`badge bg-${getDifficultyBadge(selectedGuide.difficulty)}`}>
                  {selectedGuide.difficulty}
                </span>
                <span className="badge bg-info">{selectedGuide.estimatedTime}</span>
              </div>
              
              {selectedGuide.prerequisites.length > 0 && (
                <div className="alert alert-info">
                  <strong>Prerequisites:</strong>
                  <ul className="mb-0 mt-2">
                    {selectedGuide.prerequisites.map((prereq, i) => (
                      <li key={i}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const inline = !match;
                    const { ref, ...restProps } = props;
                    return !inline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        {...restProps}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {selectedGuide.content}
              </ReactMarkdown>
            </>
          ) : (
            <div className="text-center text-muted mt-5">
              <h4>📚 Setup Guides</h4>
              <p>Select a guide from the sidebar or generate a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
