# Onboarding Buddy Application -  Comprehensive Implementation Plan

## 1. Project Setup

### Directory Structure

```bash
onboarding-buddy/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── SetupGuideViewer.tsx
│   │   │   ├── ArchitectureExplorer.tsx
│   │   │   └── ResponseDisplay.tsx
│   │   ├── services/
│   │   │   ├── api.ts          # API client
│   │   │   └── ampAgent.ts     # Amp SDK integration
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                    # Node/Express API
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── database.ts     # SQLite connection & queries
│   │   ├── routes/
│   │   │   ├── questions.ts
│   │   │   ├── guides.ts
│   │   │   └── architecture.ts
│   │   ├── services/
│   │   │   └── ampService.ts   # Amp SDK backend service
│   │   └── server.ts
│   ├── tsconfig.json
│   └── package.json
└── shared/
    └── types.ts               # Shared TypeScript types
```

### NPM Packages

**Client (`client/package.json`):**

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "bootstrap": "5.3.8",
    "@popperjs/core": "^2.11.8",
    "axios": "^1.6.0",
    "@sourcegraph/amp-sdk": "latest",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

**Server (`server/package.json`):**

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.0",
    "@sourcegraph/amp-sdk": "latest",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/express": "^4.17.21",
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.0",
    "nodemon": "^3.0.2"
  }
}
```

### Configuration Files

**`client/vite.config.ts`:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

**`client/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src"]
}
```

**`server/tsconfig.json`:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 2. Data Model (SQLite)

**Schema (`server/src/db/schema.sql`):**

```sql
-- Q&A Knowledge Base
CREATE TABLE IF NOT EXISTS qa_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX idx_qa_category ON qa_pairs(category);
CREATE INDEX idx_qa_tags ON qa_pairs(tags);

-- Setup Guides
CREATE TABLE IF NOT EXISTS setup_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- Markdown format
  prerequisites TEXT, -- JSON array
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Architecture Documentation
CREATE TABLE IF NOT EXISTS architecture_docs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  component_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  diagram_url TEXT,
  dependencies TEXT, -- JSON array
  tech_stack TEXT, -- JSON array
  file_paths TEXT, -- JSON array of relevant file paths
  code_examples TEXT, -- JSON array of code snippets
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation History (for context)
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_question TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  context_used TEXT, -- JSON array of relevant docs/QA IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conv_session ON conversations(session_id);

-- User Feedback (for improvement)
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  helpful BOOLEAN,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

**Key Fields:**

- **qa_pairs**: Core Q&A storage with categorization, tagging, and usage tracking
- **setup_guides**: Step-by-step guides with difficulty levels and time estimates
- **architecture_docs**: Component-level architecture with dependencies and code examples
- **conversations**: Maintains session context for multi-turn interactions
- **feedback**: Captures user satisfaction for continuous improvement

---

## 3. Backend/API Layer

### Technology Stack

- **Runtime**: Node.js with Express
- **Database**: better-sqlite3 (synchronous SQLite driver)
- **AI Integration**: Amp TypeScript SDK for intelligent responses

### API Endpoints (`server/src/routes/`)

**`questions.ts`:**

```typescript
POST   /api/questions/ask           // Submit new question
GET    /api/questions/search?q=     // Search existing Q&A
GET    /api/questions/recent        // Get recent questions
POST   /api/questions/feedback      // Submit feedback
```

**`guides.ts`:**

```typescript
GET    /api/guides                  // List all guides
GET    /api/guides/:id              // Get specific guide
GET    /api/guides/search?q=        // Search guides
POST   /api/guides/generate         // Generate new guide via Amp
```

**`architecture.ts`:**

```typescript
GET    /api/architecture            // List all components
GET    /api/architecture/:component // Get component details
GET    /api/architecture/graph      // Get dependency graph
POST   /api/architecture/explain    // Explain architecture via Amp
```

### Database Service (`server/src/db/database.ts`)

```typescript
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = './onboarding.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    this.db.exec(schema);
  }

  // Q&A Methods
  searchQA(query: string) { /* Full-text search */ }
  insertQA(question: string, answer: string, category: string) { /* ... */ }
  incrementUsage(id: number) { /* ... */ }

  // Guide Methods
  getAllGuides() { /* ... */ }
  getGuideById(id: number) { /* ... */ }
  
  // Architecture Methods
  getComponent(name: string) { /* ... */ }
  getAllComponents() { /* ... */ }
  
  // Conversation Methods
  saveConversation(sessionId: string, question: string, response: string) { /* ... */ }
  getSessionHistory(sessionId: string) { /* ... */ }
}
```

### Amp Service (`server/src/services/ampService.ts`)

```typescript
import { Amp } from '@sourcegraph/amp-sdk';

export class AmpService {
  private amp: Amp;

  constructor(apiKey: string) {
    this.amp = new Amp({ apiKey });
  }

  async answerQuestion(question: string, context: any[]) {
    const prompt = `You are an onboarding assistant. Answer this question using the provided context.
    
Context:
${JSON.stringify(context, null, 2)}

Question: ${question}

Provide a clear, helpful answer.`;

    const response = await this.amp.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'anthropic/claude-3.5-sonnet'
    });

    return response.choices[0].message.content;
  }

  async generateSetupGuide(topic: string, codebaseContext: string) {
    // Use Amp to generate setup guide
  }

  async explainArchitecture(component: string, codeContext: string) {
    // Use Amp to explain architecture
  }
}
```

---

## 4. Frontend Components (React/Vite)

### Core Components

**`ChatWindow.tsx`**: Main conversation interface

- Displays conversation history
- Scrollable message list
- Message bubbles (user vs agent)
- Loading states during API calls

**`QuestionInput.tsx`**: Question submission

- Text input with autocomplete suggestions
- Submit button
- Quick action buttons (common questions)
- Character count indicator

**`SetupGuideViewer.tsx`**: Guide display

- Renders Markdown content
- Step-by-step navigation
- Syntax-highlighted code blocks
- Collapsible sections
- Progress tracking

**`ArchitectureExplorer.tsx`**: Architecture visualization

- Component dependency graph (using D3.js or similar)
- Component detail panel
- Tech stack badges
- File path links
- Code snippet viewer

**`ResponseDisplay.tsx`**: Agent response formatting

- Markdown rendering with react-markdown
- Syntax highlighting with react-syntax-highlighter
- Feedback buttons (thumbs up/down)
- Copy code button
- Follow-up question suggestions

### Shared Types (`client/src/types/index.ts`)

```typescript
export interface QAPair {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  usageCount: number;
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any[];
}
```

### API Client (`client/src/services/api.ts`)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

export const questionAPI = {
  ask: (question: string, sessionId: string) => 
    api.post('/questions/ask', { question, sessionId }),
  search: (query: string) => 
    api.get(`/questions/search?q=${encodeURIComponent(query)}`),
  provideFeedback: (conversationId: number, helpful: boolean, comment?: string) =>
    api.post('/questions/feedback', { conversationId, helpful, comment })
};

export const guidesAPI = {
  getAll: () => api.get('/guides'),
  getById: (id: number) => api.get(`/guides/${id}`),
  generate: (topic: string) => api.post('/guides/generate', { topic })
};

export const architectureAPI = {
  getAll: () => api.get('/architecture'),
  getComponent: (name: string) => api.get(`/architecture/${name}`),
  explain: (component: string) => api.post('/architecture/explain', { component })
};
```

---

## 5. Core Logic Flow

### Question Handling Workflow

1. **Input Capture** (`QuestionInput.tsx`):
   - User types question
   - Generate unique `sessionId` (UUID) if new session
   - Send to `/api/questions/ask` with sessionId

2. **Backend Processing** (`server/src/routes/questions.ts`):

   ```
   a. Receive question + sessionId
   b. Query DatabaseService.searchQA() for similar questions
   c. Retrieve session history via getSessionHistory(sessionId)
   d. If exact match found (similarity > 95%):
      - Return cached answer
      - Increment usage_count
   e. If partial matches (similarity 60-95%):
      - Collect top 5 matches as context
      - Pass to AmpService.answerQuestion(question, context)
   f. If no matches:
      - Use Amp SDK with codebase context tool
      - Generate new answer
      - Store in qa_pairs for future use
   g. Save to conversations table
   h. Return response
   ```

3. **Response Display** (`ResponseDisplay.tsx`):
   - Render Markdown response
   - Show context sources (if any)
   - Display feedback buttons
   - Suggest related questions

4. **Feedback Loop**:
   - User clicks thumbs up/down
   - POST to `/api/questions/feedback`
   - Update qa_pairs relevance scores
   - Train future responses

### Setup Guide Generation

1. User requests guide for topic (e.g., "Docker setup")
2. Check `setup_guides` table for existing guide
3. If not found:
   - Use Amp SDK to analyze codebase for Docker usage
   - Generate step-by-step guide
   - Store in `setup_guides`
4. Return Markdown guide to frontend
5. Render with `SetupGuideViewer.tsx`

### Architecture Explanation

1. User selects component or asks architecture question
2. Query `architecture_docs` for component
3. If found, return cached documentation
4. If not found:
   - Use Amp SDK with codebase_search to find component files
   - Analyze dependencies and tech stack
   - Generate explanation and diagram description
   - Cache in `architecture_docs`
5. Render in `ArchitectureExplorer.tsx` with interactive graph

---

## 6. Bootstrap Integration

### Setup (`client/src/main.tsx`)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap JS (for modals, tooltips, etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Optional: Custom theme overrides
import './styles/custom.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Component Usage Pattern

```typescript
// Example: ChatWindow.tsx with Bootstrap classes
export const ChatWindow: React.FC = () => {
  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-md-8 offset-md-2">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Onboarding Buddy</h5>
            </div>
            <div className="card-body overflow-auto">
              {/* Messages */}
            </div>
            <div className="card-footer">
              <QuestionInput />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Bootstrap Utilities Used

- **Layout**: container-fluid, row, col-*
- **Components**: card, nav, navbar, modal, toast
- **Forms**: form-control, input-group, btn
- **Utilities**: shadow-sm, text-*, bg-*, d-flex, justify-content-*, align-items-*
- **Spacing**: m-*, p-*, mt-*, mb-*

### Custom Theme (`client/src/styles/custom.css`)

```css
:root {
  --bs-primary: #0066cc;
  --bs-secondary: #6c757d;
  --bs-success: #28a745;
  --bs-code-bg: #f8f9fa;
}

.message-bubble {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  margin-bottom: 0.75rem;
}

.message-user {
  background-color: var(--bs-primary);
  color: white;
  margin-left: auto;
}

.message-assistant {
  background-color: var(--bs-light);
  color: var(--bs-dark);
}
```

---

## Implementation Order

1. **Phase 1**: Server setup (Express + SQLite + schema)
2. **Phase 2**: Amp SDK integration in backend
3. **Phase 3**: Basic API endpoints (questions/ask)
4. **Phase 4**: React app scaffold with Bootstrap
5. **Phase 5**: ChatWindow + QuestionInput components
6. **Phase 6**: Response rendering and feedback
7. **Phase 7**: Setup guide generation
8. **Phase 8**: Architecture explorer
9. **Phase 9**: Testing and refinement

**Success Metrics:**

- Answer accuracy > 85%
- Average response time < 3s
- User satisfaction (feedback) > 4/5
- Guide completion rate > 70%
