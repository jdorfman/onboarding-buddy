# Onboarding Buddy

A comprehensive onboarding assistant powered by Amp SDK that helps new developers understand codebases through interactive chat and setup guides.

## Features

- **Interactive Chat**: Ask questions about the codebase and get AI-powered answers
- **Setup Guides**: Generate and view step-by-step setup guides for various topics
- **Interactive Quizzes**: Generate and take quizzes from chat conversations to test your knowledge
- **Knowledge Base**: Automatically caches Q&A for faster responses
- **Feedback System**: Rate responses to improve future answers
- **Bootstrap UI**: Clean, responsive interface

## Tech Stack

### Backend

- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Amp SDK

### Frontend

- React 18
- TypeScript
- Vite
- Bootstrap 5
- React Markdown
- React Syntax Highlighter

## Prerequisites

- Node.js 18+
- npm or pnpm

## Installation

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and add your configuration:

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/onboarding.db
AMP_API_KEY=your_amp_api_key_here
```

## Development

Start both server and client:

```bash
npm run dev
```

- Server will run on <http://localhost:3001>
- Client will run on <http://localhost:3000>

### Type Checking

Run TypeScript type checks across the entire project:

```bash
npm run typecheck
```

## Production Build

### Backend (Build)

```bash
cd server
npm run build
npm start
```

### Frontend (Build)

```bash
cd client
npm run build
npm run preview
```

## Project Structure

```bash
onboarding-buddy/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── QuizListPage.tsx
│   │   │   ├── QuizRunner.tsx
│   │   │   ├── ResponseDisplay.tsx
│   │   │   └── SetupGuideViewer.tsx
│   │   ├── services/
│   │   │   └── api.ts        # API client
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript interfaces
│   │   ├── styles/
│   │   │   └── custom.css    # Custom styles
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                    # Node/Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── database.ts   # SQLite service
│   │   ├── routes/
│   │   │   ├── questions.ts
│   │   │   ├── guides.ts
│   │   │   └── quizzes.ts
│   │   ├── services/
│   │   │   └── ampService.ts # Amp SDK integration
│   │   └── server.ts
│   ├── tsconfig.json
│   └── package.json
└── shared/
    └── types.ts              # Shared TypeScript types
```

## API Endpoints

### Questions

- `POST /api/questions/ask` - Ask a question
- `GET /api/questions/search?q=query` - Search questions
- `POST /api/questions/feedback` - Provide feedback

### Guides

- `GET /api/guides` - Get all guides
- `GET /api/guides/:id` - Get guide by ID
- `POST /api/guides/generate` - Generate new guide

### Quizzes

- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID with questions
- `POST /api/quizzes/generate` - Generate quiz from chat session
- `POST /api/quizzes/:id/submit` - Submit quiz answers

## Database Schema

The application uses SQLite with the following tables:

- **qa_pairs**: Q&A knowledge base with categorization and usage tracking
- **setup_guides**: Step-by-step guides with difficulty levels
- **chat_sessions**: Chat session management
- **conversations**: Session history for context-aware responses
- **feedback**: User feedback for continuous improvement
- **quizzes**: Generated quizzes linked to chat sessions
- **quiz_questions**: True/false questions with explanations and guide references

### Useful Database Queries

```bash
# View all feedback
sqlite3 server/data/onboarding.db "SELECT * FROM feedback"

# Count helpful vs not helpful feedback
sqlite3 server/data/onboarding.db "SELECT helpful, COUNT(*) as count FROM feedback GROUP BY helpful"

# View most used Q&A pairs
sqlite3 server/data/onboarding.db "SELECT question, usage_count FROM qa_pairs ORDER BY usage_count DESC LIMIT 10"

# View recent conversations with feedback
sqlite3 server/data/onboarding.db "SELECT c.question, c.created_at, f.helpful FROM conversations c LEFT JOIN feedback f ON c.id = f.conversation_id ORDER BY c.created_at DESC LIMIT 10"

# View all setup guides
sqlite3 server/data/onboarding.db "SELECT topic, difficulty, estimated_minutes FROM setup_guides ORDER BY created_at DESC"
```

## Usage

### Asking Questions

1. Navigate to the Chat tab
2. Type your question in the input field
3. Receive AI-powered answers with context from the codebase
4. Rate the response to help improve future answers

### Generating Setup Guides

1. Navigate to the Setup Guides tab
2. Enter a topic in the search box
3. Click the "+" button to generate a new guide
4. View the guide with prerequisites, difficulty level, and estimated time

## Success Metrics

The application is designed to achieve:

- **Answer Accuracy**: >85%
- **Response Time**: <3 seconds average
- **User Satisfaction**: >4/5 based on feedback
- **Guide Completion**: >70% completion rate

## Customization

### Custom Styling

Edit `client/src/styles/custom.css` to customize the theme:

```css
:root {
  --bs-primary: #0066cc;
  --bs-secondary: #6c757d;
  --bs-success: #28a745;
}
```

### Amp Agent Configuration

Modify `server/src/services/ampService.ts` to customize the AI agent behavior:

```typescript
this.agent = new Agent({
  name: 'Onboarding Buddy',
  instructions: 'Your custom instructions here...'
});
```

## Troubleshooting

### Database Issues

If you encounter database errors, delete the database file and restart:

```bash
rm server/data/onboarding.db
```

### Port Conflicts

If ports 3000 or 3001 are in use, update the configuration:

- Frontend: Edit `client/vite.config.ts`
- Backend: Edit `server/.env`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
