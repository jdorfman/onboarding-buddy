import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = './data/onboarding.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    this.db.exec(schema);
  }

  searchQA(query: string, limit: number = 5): any[] {
    const stmt = this.db.prepare(`
      SELECT id, question, answer, category, tags, usage_count
      FROM qa_pairs
      WHERE question LIKE ? OR answer LIKE ?
      ORDER BY usage_count DESC
      LIMIT ?
    `);
    const pattern = `%${query}%`;
    return stmt.all(pattern, pattern, limit);
  }

  getQAById(id: number): any {
    const stmt = this.db.prepare('SELECT * FROM qa_pairs WHERE id = ?');
    return stmt.get(id);
  }

  insertQA(question: string, answer: string, category: string, tags: string[]): number {
    const stmt = this.db.prepare(`
      INSERT INTO qa_pairs (question, answer, category, tags)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(question, answer, category, JSON.stringify(tags));
    return result.lastInsertRowid as number;
  }

  incrementQAUsage(id: number): void {
    const stmt = this.db.prepare('UPDATE qa_pairs SET usage_count = usage_count + 1 WHERE id = ?');
    stmt.run(id);
  }

  getAllChatSessions(): any[] {
    const stmt = this.db.prepare(`
      SELECT cs.*, 
        (SELECT user_question FROM conversations WHERE session_id = cs.id ORDER BY created_at ASC LIMIT 1) as first_question,
        (SELECT COUNT(*) FROM conversations WHERE session_id = cs.id) as message_count
      FROM chat_sessions cs
      ORDER BY cs.updated_at DESC
    `);
    return stmt.all();
  }

  getChatSession(sessionId: string): any {
    const stmt = this.db.prepare('SELECT * FROM chat_sessions WHERE id = ?');
    return stmt.get(sessionId);
  }

  createChatSession(sessionId: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO chat_sessions (id)
      VALUES (?)
      ON CONFLICT(id) DO NOTHING
    `);
    stmt.run(sessionId);
  }

  updateChatSessionTitle(sessionId: string, title: string): void {
    const stmt = this.db.prepare(`
      UPDATE chat_sessions 
      SET title = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(title, sessionId);
  }

  getSessionHistory(sessionId: string, limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(sessionId, limit);
  }

  insertConversation(sessionId: string, userQuestion: string, agentResponse: string, contextUsed: any[]): number {
    this.createChatSession(sessionId);
    
    const stmt = this.db.prepare(`
      INSERT INTO conversations (session_id, user_question, agent_response, context_used)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(sessionId, userQuestion, agentResponse, JSON.stringify(contextUsed));
    
    const updateStmt = this.db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(sessionId);
    
    const conversations = this.getSessionHistory(sessionId, 1);
    if (conversations.length === 1) {
      const title = userQuestion.slice(0, 60);
      this.updateChatSessionTitle(sessionId, title);
    }
    
    return result.lastInsertRowid as number;
  }

  insertFeedback(conversationId: number, helpful: boolean, comment?: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO feedback (conversation_id, helpful, comment)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(conversationId, helpful ? 1 : 0, comment || null);
    return result.lastInsertRowid as number;
  }

  getAllGuides(): any[] {
    const stmt = this.db.prepare('SELECT * FROM setup_guides ORDER BY created_at DESC');
    return stmt.all();
  }

  getGuideById(id: number): any {
    const stmt = this.db.prepare('SELECT * FROM setup_guides WHERE id = ?');
    const guide: any = stmt.get(id);
    if (guide) {
      return {
        ...guide,
        prerequisites: JSON.parse(guide.prerequisites || '[]')
      };
    }
    return null;
  }

  insertGuide(title: string, description: string, content: string, prerequisites: string[], difficulty: string, estimatedTime: string): number {
    const stmt = this.db.prepare(`
      INSERT INTO setup_guides (title, description, content, prerequisites, difficulty, estimated_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, description, content, JSON.stringify(prerequisites), difficulty, estimatedTime);
    return result.lastInsertRowid as number;
  }

  getAllQuizzes(): any[] {
    const stmt = this.db.prepare(`
      SELECT q.*, 
        cs.title as chat_title,
        cs.id as chat_id,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
      FROM quizzes q
      LEFT JOIN chat_sessions cs ON q.source_chat_id = cs.id
      ORDER BY q.created_at DESC
    `);
    return stmt.all();
  }

  getQuizById(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM quizzes WHERE id = ?');
    return stmt.get(id);
  }

  getQuizWithQuestions(id: string): any {
    const quiz = this.getQuizById(id);
    if (!quiz) return null;

    const questionsStmt = this.db.prepare(`
      SELECT * FROM quiz_questions 
      WHERE quiz_id = ? 
      ORDER BY created_at ASC
    `);
    const questions = questionsStmt.all(id) as any[];

    return {
      ...quiz,
      questions: questions.map((q: any) => ({
        ...q,
        correct_answer: q.correct_answer === 1,
        guide_refs: q.guide_refs ? JSON.parse(q.guide_refs) : null
      }))
    };
  }

  insertQuiz(id: string, title: string, sourceChatId: string | null): void {
    const stmt = this.db.prepare(`
      INSERT INTO quizzes (id, title, source_chat_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, title, sourceChatId);
  }

  insertQuizQuestion(id: string, quizId: string, text: string, correctAnswer: boolean, explanation: string, sourceMessageId: number | null, guideRefs: any[] | null): void {
    const stmt = this.db.prepare(`
      INSERT INTO quiz_questions (id, quiz_id, text, correct_answer, explanation, source_message_id, guide_refs)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      quizId,
      text,
      correctAnswer ? 1 : 0,
      explanation,
      sourceMessageId,
      guideRefs ? JSON.stringify(guideRefs) : null
    );
  }

  deleteQuiz(id: string): void {
    const stmt = this.db.prepare('DELETE FROM quizzes WHERE id = ?');
    stmt.run(id);
  }

  close(): void {
    this.db.close();
  }
}
