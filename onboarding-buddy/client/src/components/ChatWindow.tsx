import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { QuestionInput } from './QuestionInput';
import { ResponseDisplay } from './ResponseDisplay';
import { questionAPI } from '../services/api';

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuestion = async (question: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await questionAPI.ask(question, sessionId);
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
        context: response.data.context,
        relatedQuestions: response.data.relatedQuestions,
        conversationId: response.data.conversationId
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get answer:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-md-8 offset-md-2 h-100 d-flex flex-column py-3">
          <div className="card shadow-sm flex-grow-1 d-flex flex-column">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Onboarding Buddy</h5>
              <small>Ask me anything about the codebase</small>
            </div>
            
            <div className="card-body overflow-auto flex-grow-1">
              {messages.length === 0 && (
                <div className="text-center text-muted mt-5">
                  <h4>Welcome! 👋</h4>
                  <p>I'm your onboarding buddy. Ask me questions about:</p>
                  <ul className="list-unstyled">
                    <li>• How to set up the development environment</li>
                    <li>• Architecture and component structure</li>
                    <li>• Code patterns and best practices</li>
                    <li>• Where to find specific functionality</li>
                  </ul>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-3`}
                >
                  {message.role === 'user' ? (
                    <div className="message-user message-bubble">
                      {message.content}
                    </div>
                  ) : (
                    <ResponseDisplay message={message} />
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="d-flex justify-content-start mb-3">
                  <div className="message-assistant message-bubble">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="card-footer">
              <QuestionInput onSubmit={handleQuestion} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
