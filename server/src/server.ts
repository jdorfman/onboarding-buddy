import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import questionsRouter from './routes/questions';
import guidesRouter from './routes/guides';
import quizzesRouter from './routes/quizzes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.use('/api/questions', questionsRouter);
app.use('/api/guides', guidesRouter);
app.use('/api/quizzes', quizzesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Onboarding Buddy API server running on port ${PORT}`);
console.log(`Health check: http://localhost:${PORT}/api/health`);
});
