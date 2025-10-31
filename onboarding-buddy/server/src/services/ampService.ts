import { execute, createUserMessage } from '@sourcegraph/amp-sdk';

export class AmpService {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = `You are an expert onboarding assistant helping new developers understand the codebase.
Your responsibilities:
- Answer questions about the codebase and components
- Generate step-by-step setup guides
- Explain code patterns and best practices
- Provide context-aware responses based on the actual codebase

Always be helpful, concise, and provide code examples when relevant.`;
  }

  async answerQuestion(question: string, context: any[] = []): Promise<string> {
    const contextText = context.length > 0
      ? `\n\nRelevant context from knowledge base:\n${context.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n')}`
      : '';

    const response = await this.executePrompt(`${question}${contextText}`);
    return response;
  }

  private async executePrompt(prompt: string): Promise<string> {
    let result = '';
    
    for await (const message of execute({
      prompt: `${this.systemPrompt}\n\n${prompt}`,
      options: {
        dangerouslyAllowAll: true
      }
    })) {
      if (message.type === 'assistant') {
        for (const content of message.message.content) {
          if (content.type === 'text' && content.text) {
            result += content.text;
          }
        }
      }
    }
    
    return result;
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

    const response = await this.executePrompt(prompt);
    
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

  async searchCodebase(query: string): Promise<string> {
    const response = await this.executePrompt(`Search the codebase for: ${query}`);
    return response;
  }

  async generateQuizQuestions(messages: any[], questionCount: number = 5): Promise<any[]> {
    const messageContext = messages
      .map((m, idx) => `Message ${idx + 1}:\nQ: ${m.user_question}\nA: ${m.agent_response}`)
      .join('\n\n');

    const prompt = `Based on the following conversation messages, generate ${questionCount} true/false quiz questions to test understanding of the content.

${messageContext}

Generate a mix of true and false statements. For each question, provide:
- text: The statement to evaluate
- correct_answer: true or false
- explanation: A brief explanation of why the answer is correct
- source_message_id: The ID of the message this question is based on (use the message id from the messages provided)

Provide the response as a JSON array:
[
  {
    "text": "Statement here",
    "correct_answer": true,
    "explanation": "Explanation here",
    "source_message_id": 123
  }
]

Make the statements clear and focused on key concepts from the conversation.`;

    const response = await this.executePrompt(prompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        return questions.slice(0, questionCount);
      }
    } catch (error) {
      console.error('Failed to parse quiz questions JSON:', error);
    }

    return [];
  }
}
