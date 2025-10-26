import { Router } from 'express';
import { DatabaseService } from '../db/database';
import { AmpService } from '../services/ampService';

const router = Router();
const db = new DatabaseService();
const ampService = new AmpService();

router.post('/ask', async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    if (!question || !sessionId) {
      return res.status(400).json({ error: 'Question and sessionId are required' });
    }

    const similarQA = db.searchQA(question, 5);
    const sessionHistory = db.getSessionHistory(sessionId, 10);

    let answer: string;
    let contextUsed: any[] = [];

    if (similarQA.length > 0 && similarQA[0].question.toLowerCase() === question.toLowerCase()) {
      answer = similarQA[0].answer;
      db.incrementQAUsage(similarQA[0].id);
      contextUsed = [{ type: 'cached', id: similarQA[0].id }];
    } else {
      const context = similarQA.slice(0, 3);
      answer = await ampService.answerQuestion(question, context);
      
      db.insertQA(question, answer, 'general', []);
      contextUsed = context.map(qa => ({ type: 'similar', id: qa.id }));
    }

    const conversationId = db.insertConversation(sessionId, question, answer, contextUsed);

    res.json({
      answer,
      conversationId,
      context: contextUsed,
      relatedQuestions: similarQA.slice(0, 3).map(qa => qa.question)
    });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const results = db.searchQA(q, 10);
    res.json(results);
  } catch (error) {
    console.error('Error searching questions:', error);
    res.status(500).json({ error: 'Failed to search questions' });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { conversationId, helpful, comment } = req.body;

    if (conversationId === undefined || helpful === undefined) {
      return res.status(400).json({ error: 'conversationId and helpful are required' });
    }

    const feedbackId = db.insertFeedback(conversationId, helpful, comment);
    res.json({ id: feedbackId, success: true });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
