-- Q&A Knowledge Base
CREATE TABLE IF NOT EXISTS qa_pairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qa_category ON qa_pairs(category);
CREATE INDEX IF NOT EXISTS idx_qa_tags ON qa_pairs(tags);

-- Setup Guides
CREATE TABLE IF NOT EXISTS setup_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  prerequisites TEXT,
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
  dependencies TEXT,
  tech_stack TEXT,
  file_paths TEXT,
  code_examples TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation History (for context)
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_question TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  context_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations(session_id);

-- User Feedback (for improvement)
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER,
  helpful BOOLEAN,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
