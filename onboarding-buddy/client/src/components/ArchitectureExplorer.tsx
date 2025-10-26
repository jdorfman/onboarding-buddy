import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArchitectureComponent } from '../types';
import { architectureAPI } from '../services/api';

export const ArchitectureExplorer: React.FC = () => {
  const [components, setComponents] = useState<ArchitectureComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      const response = await architectureAPI.getAll();
      setComponents(response.data);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  const handleExplainComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await architectureAPI.explain(searchTerm);
      const component = response.data;
      setComponents(prev => {
        const exists = prev.find(c => c.componentName === component.componentName);
        return exists ? prev : [component, ...prev];
      });
      setSelectedComponent(component);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to explain component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-md-3 border-end p-3">
          <h5>Components</h5>
          
          <form onSubmit={handleExplainComponent} className="mb-3">
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Analyze component..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? '...' : '🔍'}
              </button>
            </div>
          </form>

          <div className="list-group">
            {components.map((component) => (
              <button
                key={component.id}
                className={`list-group-item list-group-item-action ${selectedComponent?.id === component.id ? 'active' : ''}`}
                onClick={() => setSelectedComponent(component)}
              >
                <h6 className="mb-1">{component.componentName}</h6>
                <small className="text-truncate d-block">{component.description.slice(0, 60)}...</small>
              </button>
            ))}
          </div>
        </div>

        <div className="col-md-9 p-4 overflow-auto">
          {selectedComponent ? (
            <>
              <h2>{selectedComponent.componentName}</h2>
              <p className="lead">{selectedComponent.description}</p>

              {selectedComponent.techStack.length > 0 && (
                <div className="mb-3">
                  <h5>Tech Stack</h5>
                  <div className="d-flex gap-2 flex-wrap">
                    {selectedComponent.techStack.map((tech, i) => (
                      <span key={i} className="badge bg-primary">{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedComponent.dependencies.length > 0 && (
                <div className="mb-3">
                  <h5>Dependencies</h5>
                  <ul>
                    {selectedComponent.dependencies.map((dep, i) => (
                      <li key={i}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedComponent.filePaths.length > 0 && (
                <div className="mb-3">
                  <h5>Key Files</h5>
                  <ul className="list-unstyled">
                    {selectedComponent.filePaths.map((path, i) => (
                      <li key={i}>
                        <code>{path}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedComponent.codeExamples.length > 0 && (
                <div className="mb-3">
                  <h5>Code Examples</h5>
                  {selectedComponent.codeExamples.map((example, i) => (
                    <div key={i} className="mb-3">
                      <p><strong>{example.description}</strong></p>
                      <SyntaxHighlighter language={example.language} style={vscDarkPlus}>
                        {example.code}
                      </SyntaxHighlighter>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted mt-5">
              <h4>🏗️ Architecture Explorer</h4>
              <p>Select a component from the sidebar or search for one to analyze</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
