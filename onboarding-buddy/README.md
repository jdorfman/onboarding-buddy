# Onboarding Buddy Application

A comprehensive onboarding assistant powered by Amp SDK that helps new developers understand codebases through interactive chat, setup guides, and architecture exploration.

## Features

- Interactive Chat**: Ask questions about the codebase and get AI-powered answers
- Setup Guides**: Generate and view step-by-step setup guides for various topics
- Architecture Explorer**: Explore and understand component architecture
- Knowledge Base**: Automatically caches Q&A for faster responses
- Feedback System**: Rate responses to improve future answers
- Bootstrap UI**: Clean, responsive interface

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

- Server will run on http://localhost:3001
- Client will run on http://localhost:3000

## Production Build

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend

```bash
cd client
npm run build
npm run preview
```

## Project Structure

```
onboarding-buddy/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── ResponseDisplay.tsx
│   │   │   ├── SetupGuideViewer.tsx
│   │   │   └── ArchitectureExplorer.tsx
│   │   ├── services/
│   │   │   └── api.ts        # API client
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript interfaces
│   │   ├── styles/
│   │   │   └── custom.css    # Custom styles
│   │   ├── App.tsx
│   │   └── main.tsx
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
│   │   │   └── architecture.ts
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

### Architecture
- `GET /api/architecture` - Get all architecture docs
- `GET /api/architecture/:name` - Get component by name
- `POST /api/architecture/explain` - Explain a component

## Database Schema

The application uses SQLite with the following tables:

- **qa_pairs**: Q&A knowledge base with categorization and usage tracking
- **setup_guides**: Step-by-step guides with difficulty levels
- **architecture_docs**: Component architecture documentation
- **conversations**: Session history for context-aware responses
- **feedback**: User feedback for continuous improvement

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

### Exploring Architecture

1. Navigate to the Architecture tab
2. Search for a component to analyze
3. View dependencies, tech stack, file paths, and code examples
4. Explore related components

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
