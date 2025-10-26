import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../types';
import { questionAPI } from '../services/api';

interface ResponseDisplayProps {
  message: Message;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ message }) => {
  const [feedbackGiven, setFeedbackGiven] = React.useState(false);

  const handleFeedback = async (helpful: boolean) => {
    if (message.conversationId) {
      try {
        await questionAPI.provideFeedback(message.conversationId, helpful);
        setFeedbackGiven(true);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    }
  };

  return (
    <div className="message-assistant message-bubble">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return !inline ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
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
        {message.content}
      </ReactMarkdown>

      {message.relatedQuestions && message.relatedQuestions.length > 0 && (
        <div className="mt-3">
          <small className="text-muted">Related questions:</small>
          <ul className="list-unstyled mt-1">
            {message.relatedQuestions.map((q, i) => (
              <li key={i}>
                <small>• {q}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message.conversationId && !feedbackGiven && (
        <div className="mt-3 d-flex gap-2">
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => handleFeedback(true)}
          >
            👍 Helpful
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => handleFeedback(false)}
          >
            👎 Not helpful
          </button>
        </div>
      )}

      {feedbackGiven && (
        <div className="mt-2">
          <small className="text-success">✓ Thanks for your feedback!</small>
        </div>
      )}
    </div>
  );
};
