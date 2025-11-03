import { Router } from 'express';
import { DatabaseService } from '../db/database.js';
import { AmpService } from '../services/ampService.js';
import { requireAuth } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();
const db = new DatabaseService();
const ampService = new AmpService();

router.get('/', async (req, res) => {
  try {
    const quizzes = db.getAllQuizzes();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = db.getQuizWithQuestions(id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { chatId, questionCount = 5, title } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    const chatSession = db.getChatSession(chatId);
    if (!chatSession) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    const messages = db.getSessionHistory(chatId, 100).reverse();
    
    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages in chat to generate quiz from' });
    }

    const questions = await ampService.generateQuizQuestions(messages, questionCount);
    
    if (questions.length === 0) {
      return res.status(500).json({ error: 'Failed to generate quiz questions' });
    }

    const quizId = randomUUID();
    const quizTitle = title || `Quiz from ${chatSession.title || 'chat'} - ${new Date().toLocaleDateString()}`;
    
    db.insertQuiz(quizId, quizTitle, chatId);

    questions.forEach((q) => {
      const questionId = randomUUID();
      db.insertQuizQuestion(
        questionId,
        quizId,
        q.text,
        q.correct_answer,
        q.explanation || '',
        q.source_message_id || null,
        q.guide_refs || null
      );
    });

    const quiz = db.getQuizWithQuestions(quizId);
    res.json(quiz);
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

router.post('/:id/grade', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const quiz = db.getQuizWithQuestions(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const results = quiz.questions.map((question: any) => {
      const userAnswer = answers.find(a => a.questionId === question.id);
      const selected = userAnswer?.selected ?? null;
      const isCorrect = selected === question.correct_answer;

      return {
        questionId: question.id,
        selected,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        explanation: question.explanation,
        source_message_id: question.source_message_id,
        guide_refs: question.guide_refs
      };
    });

    const score = results.filter((r: any) => r.is_correct).length;
    const total = results.length;

    res.json({ score, total, results });
  } catch (error) {
    console.error('Error grading quiz:', error);
    res.status(500).json({ error: 'Failed to grade quiz' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    db.deleteQuiz(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

export default router;
