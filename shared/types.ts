export interface QAPair {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  usageCount: number;
}

export interface SetupGuide {
  id: number;
  title: string;
  description: string;
  content: string;
  prerequisites: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any[];
}

export interface Conversation {
  id: number;
  sessionId: string;
  userQuestion: string;
  agentResponse: string;
  contextUsed: any[];
  createdAt: Date;
}

export interface Feedback {
  conversationId: number;
  helpful: boolean;
  comment?: string;
}
