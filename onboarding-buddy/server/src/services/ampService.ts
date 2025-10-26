import { Agent } from '@sourcegraph/amp-sdk';

export class AmpService {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      name: 'Onboarding Buddy',
      instructions: `You are an expert onboarding assistant helping new developers understand the codebase.
Your responsibilities:
- Answer questions about the codebase architecture and components
- Generate step-by-step setup guides
- Explain code patterns and best practices
- Provide context-aware responses based on the actual codebase

Always be helpful, concise, and provide code examples when relevant.`
    });
  }

  async answerQuestion(question: string, context: any[] = []): Promise<string> {
    const contextText = context.length > 0
      ? `\n\nRelevant context from knowledge base:\n${context.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n')}`
      : '';

    const response = await this.agent.chat(`${question}${contextText}`);
    return response;
  }

  async generateSetupGuide(topic: string, codebaseContext?: string): Promise<{
    title: string;
    description: string;
    content: string;
    prerequisites: string[];
    difficulty: string;
    estimatedTime: string;
  }> {
    const prompt = `Generate a comprehensive setup guide for: ${topic}

${codebaseContext ? `Based on the codebase context:\n${codebaseContext}\n\n` : ''}

Provide the response in the following JSON format:
{
  "title": "Guide title",
  "description": "Brief description",
  "content": "Full markdown content with step-by-step instructions",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": "X minutes"
}`;

    const response = await this.agent.chat(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse guide JSON:', error);
    }

    return {
      title: topic,
      description: `Setup guide for ${topic}`,
      content: response,
      prerequisites: [],
      difficulty: 'beginner',
      estimatedTime: '30 minutes'
    };
  }

  async explainArchitecture(component: string): Promise<{
    componentName: string;
    description: string;
    dependencies: string[];
    techStack: string[];
    filePaths: string[];
    codeExamples: any[];
  }> {
    const prompt = `Analyze the architecture of the component: ${component}

Provide a comprehensive explanation including:
- Description of the component's purpose and functionality
- Dependencies (other components it relies on)
- Technology stack used
- Relevant file paths
- Code examples demonstrating key functionality

Return the response in JSON format:
{
  "componentName": "${component}",
  "description": "Detailed description",
  "dependencies": ["dep1", "dep2"],
  "techStack": ["tech1", "tech2"],
  "filePaths": ["path1", "path2"],
  "codeExamples": [
    {
      "language": "typescript",
      "code": "example code",
      "description": "What this code does"
    }
  ]
}`;

    const response = await this.agent.chat(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse architecture JSON:', error);
    }

    return {
      componentName: component,
      description: response,
      dependencies: [],
      techStack: [],
      filePaths: [],
      codeExamples: []
    };
  }

  async searchCodebase(query: string): Promise<string> {
    const response = await this.agent.chat(`Search the codebase for: ${query}`);
    return response;
  }
}
