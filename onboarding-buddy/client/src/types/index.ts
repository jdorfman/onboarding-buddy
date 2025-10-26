export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any[];
  relatedQuestions?: string[];
  conversationId?: number;
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

export interface ArchitectureComponent {
  id: number;
  componentName: string;
  description: string;
  dependencies: string[];
  techStack: string[];
  filePaths: string[];
  codeExamples: CodeExample[];
}

export interface CodeExample {
  language: string;
  code: string;
  description: string;
}
