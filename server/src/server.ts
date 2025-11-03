import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import questionsRouter from './routes/questions.js';
import guidesRouter from './routes/guides.js';
import quizzesRouter from './routes/quizzes.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());

app.use('/auth', authRouter);
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
