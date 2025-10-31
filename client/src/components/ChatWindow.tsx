import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Message } from '../types';
import { QuestionInput } from './QuestionInput';
import { ResponseDisplay } from './ResponseDisplay';
import { questionAPI } from '../services/api';

interface ChatSession {
  id: string;
  title: string;
  first_question: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export const ChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => 
    chatId || `session-${Date.now()}-${Math.random()}`
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatSessions();
  }, []);

  useEffect(() => {
    if (chatId && chatId !== currentSessionId) {
      loadChat(chatId);
      setCurrentSessionId(chatId);
    }
  }, [chatId]);

  const loadChatSessions = async () => {
    try {
      const response = await questionAPI.getAllChats();
      setChatSessions(response.data);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const loadChat = async (sessionId: string) => {
    try {
      const response = await questionAPI.getChat(sessionId);
      const loadedMessages: Message[] = response.data.messages.map((msg: any) => ({
        id: `msg-${msg.id}`,
        role: msg.user_question ? 'user' : 'assistant',
        content: msg.user_question || msg.agent_response,
        timestamp: new Date(msg.created_at),
        context: msg.context_used ? JSON.parse(msg.context_used) : undefined
      }));
      
      const formattedMessages: Message[] = [];
      response.data.messages.forEach((msg: any) => {
        formattedMessages.push({
          id: `msg-${msg.id}-q`,
          role: 'user',
          content: msg.user_question,
          timestamp: new Date(msg.created_at)
        });
        formattedMessages.push({
          id: `msg-${msg.id}-a`,
          role: 'assistant',
          content: msg.agent_response,
          timestamp: new Date(msg.created_at),
          context: msg.context_used ? JSON.parse(msg.context_used) : undefined
        });
      });
      
      setMessages(formattedMessages);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const createNewChat = () => {
    const newSessionId = `session-${Date.now()}-${Math.random()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setSelectedMessage(null);
    setSearchTerm('');
    navigate('/');
  };

  const filteredChatSessions = useMemo(() => {
    if (!searchTerm.trim()) return chatSessions;
    
    const term = searchTerm.toLowerCase();
    return chatSessions.filter(session => {
      const title = session.title || session.first_question || '';
      return title.toLowerCase().includes(term);
    });
  }, [chatSessions, searchTerm]);

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
      const response = await questionAPI.ask(question, currentSessionId);
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
      setSelectedMessage(assistantMessage);
      
      await loadChatSessions();
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

  const exportChatAsMarkdown = () => {
    let markdown = '# Onboarding Buddy Chat Session\n\n';
    markdown += `Session ID: ${currentSessionId}\n\n`;
    markdown += '---\n\n';

    for (let i = 0; i < messages.length; i += 2) {
      const userMsg = messages[i];
      const assistantMsg = messages[i + 1];

      if (userMsg && userMsg.role === 'user') {
        markdown += `## Question\n\n${userMsg.content}\n\n`;
      }

      if (assistantMsg && assistantMsg.role === 'assistant') {
        markdown += `## Answer\n\n${assistantMsg.content}\n\n`;
        
        if (assistantMsg.context) {
          markdown += `### Context Used\n\n`;
          assistantMsg.context.forEach((ctx: any) => {
            markdown += `- **${ctx.file}** (lines ${ctx.start}-${ctx.end})\n`;
          });
          markdown += '\n';
        }
        
        markdown += '---\n\n';
      }
    }

    return markdown;
  };

  const copyToClipboard = async () => {
    try {
      const markdown = exportChatAsMarkdown();
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-md-3 border-end p-3 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Chats</h5>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={createNewChat}
              title="New Chat"
            >
              +
            </button>
          </div>
          
          <form onSubmit={(e) => e.preventDefault()} className="mb-3">
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Search answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="btn btn-outline-secondary" 
                  type="button"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
          </form>

          <div className="overflow-auto flex-grow-1">
            {chatSessions.length === 0 && (
              <p className="text-muted small">No chats yet</p>
            )}
            {chatSessions.length > 0 && filteredChatSessions.length === 0 && (
              <p className="text-muted small">No chats match your search</p>
            )}
            <div className="list-group">
              {filteredChatSessions.map((session) => (
                <button
                  key={session.id}
                  className={`list-group-item list-group-item-action ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => {
                    navigate(`/chat/${session.id}`);
                  }}
                >
                  <h6 className="mb-1 text-truncate">
                    {session.title || session.first_question || 'New Chat'}
                  </h6>
                  <small className="text-truncate d-block">
                    {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                  </small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-9 p-4 d-flex flex-column">
          {messages.length > 0 && (
            <div className="d-flex justify-content-end mb-3 gap-2">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => navigate(`/quiz?fromChat=${currentSessionId}`)}
                title="Generate quiz from this chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-patch-question me-1" viewBox="0 0 16 16">
                  <path d="M8.05 9.6c.336 0 .504-.24.554-.627.04-.534.198-.815.847-1.26.673-.475 1.049-1.09 1.049-1.986 0-1.325-.92-2.227-2.262-2.227-1.02 0-1.792.492-2.1 1.29A1.71 1.71 0 0 0 6 5.48c0 .393.203.64.545.64.272 0 .455-.147.564-.51.158-.592.525-.915 1.074-.915.61 0 1.03.446 1.03 1.084 0 .563-.208.885-.822 1.325-.619.433-.926.914-.926 1.64v.111c0 .428.208.745.585.745"/>
                  <path d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z"/>
                  <path d="M7.001 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0"/>
                </svg>
                Generate Quiz
              </button>
              <button 
                className={`btn btn-sm ${isCopied ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={copyToClipboard}
                title="Copy page as Markdown"
                disabled={isCopied}
              >
                {isCopied ? (
                  <>
                    <span className="me-1">✓</span>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-markdown me-1" viewBox="0 0 16 16">
                      <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/>
                      <path fillRule="evenodd" d="M9.146 8.146a.5.5 0 0 1 .708 0L11.5 9.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708"/>
                      <path fillRule="evenodd" d="M11.5 5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5"/>
                      <path d="M3.56 11V7.01h.056l1.428 3.239h.774l1.42-3.24h.056V11h1.073V5.001h-1.2l-1.71 3.894h-.039l-1.71-3.894H2.5V11z"/>
                    </svg>
                    Copy page
                  </>
                )}
              </button>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center text-muted mt-5">
              <h4>Welcome!</h4>
              <p>I'm your onboarding buddy. Ask me questions about:</p>
              <ul className="list-unstyled">
                <li>
                  <button 
                    className="btn btn-link text-decoration-none p-0"
                    onClick={() => handleQuestion('How to set up the development environment')}
                  >
                    • How to set up the development environment
                  </button>
                </li>
                <li>
                  <button 
                    className="btn btn-link text-decoration-none p-0"
                    onClick={() => handleQuestion('Code patterns and best practices')}
                  >
                    • Code patterns and best practices
                  </button>
                </li>
                <li>
                  <button 
                    className="btn btn-link text-decoration-none p-0"
                    onClick={() => handleQuestion('Where to find specific functionality')}
                  >
                    • Where to find specific functionality
                  </button>
                </li>
              </ul>
            </div>
          ) : selectedMessage ? (
            <div className="overflow-auto flex-grow-1 mb-3">
              <ResponseDisplay message={selectedMessage} />
            </div>
          ) : (
            <div className="overflow-auto flex-grow-1 mb-3">
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
          )}

          <div className="mt-auto">
            <QuestionInput onSubmit={handleQuestion} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
