# Lessons from other attempts

This document contains implementation guides and lessons learned.

## Sign in with GitHub

### Overview
Implement "Sign in with GitHub" using WorkOS server-side OAuth: the server initiates and completes OAuth, stores a minimal user object in the session, and the React client interacts via `/auth` endpoints using cookies.

### Dependencies

#### Server (No new dependencies needed)
- `@workos-inc/node` ^7.26.0
- `express-session` ^1.17.3
- `cors` ^2.8.5
- `dotenv` ^16.3.1
- `better-sqlite3` ^12.4.1

#### Client (No new dependencies needed)
- `axios` ^1.6.0
- `react-router-dom` ^7.9.4

### Environment Configuration

#### Server `.env` (server/.env)
```bash
PORT=3001
SESSION_SECRET=change-me-in-prod
CLIENT_ORIGIN=http://localhost:3000
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=project_client_id_from_workos
WORKOS_REDIRECT_URI=http://localhost:3001/auth/callback
```

#### Client `.env` (client/.env)
```bash
VITE_API_BASE_URL=http://localhost:3001
```

#### WorkOS Dashboard Setup
1. Create a project and enable User Management
2. Add GitHub as an OAuth provider
3. Configure Redirect URI: `http://localhost:3001/auth/callback`
4. Copy API Key and Client ID into server `.env`

### Server Implementation

#### 1. Session and CORS Configuration (server/src/server.ts)

```typescript
import cors from 'cors';
import session from 'express-session';

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
```

#### 2. Auth Routes (server/src/routes/auth.ts)

**GET /auth/github**
- Purpose: Start OAuth with GitHub via WorkOS
- Response: 302 redirect to WorkOS authorization URL
- Errors: 500 { error: 'Failed to initiate authentication' }

**GET /auth/callback?code=...**
- Purpose: Complete OAuth, create session
- Response: 302 redirect to CLIENT_ORIGIN (home page)
- Errors: 400 { error: 'Authorization code is required' }, 500 { error: 'Authentication failed' }

**GET /auth/me**
- Purpose: Get current authenticated user
- Response 200: { id, email, firstName?, lastName?, profilePicture? }
- Response 401: { error: 'Not authenticated' }

**POST /auth/logout**
- Purpose: End session
- Response 200: { success: true }
- Errors: 500 { error: 'Logout failed' }

#### 3. Auth Middleware
Export `requireAuth` middleware and use it on all POST/DELETE endpoints for guides, quizzes, and questions.

### Client Implementation

#### 1. Axios Configuration (client/src/api/http.ts)

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true, // Required for session cookies
});
```

#### 2. User Types (client/src/types/auth.ts)

```typescript
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};
```

#### 3. User Context (client/src/contexts/UserContext.tsx)

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/http';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<Ctx>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  const login = () => {
    window.location.href = `${api.defaults.baseURL}/auth/github`;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
```

#### 4. Wrap App with Provider (client/src/main.tsx)

```typescript
import { UserProvider } from './contexts/UserContext';

<UserProvider>
  <App />
</UserProvider>
```

#### 5. SignInButton Component (client/src/components/SignInButton.tsx)
Use the existing component that binds to UserContext with "Sign in with GitHub" text.

#### 6. Optional: Protected Route Interceptor

```typescript
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Optionally trigger a login modal or redirect
    }
    return Promise.reject(err);
  }
);
```

### Database Schema Changes
**None required.** User identity is stored in server session. Optional future enhancement: create users table for persistence.

### Authentication Flow
1. User clicks "Sign in with GitHub" → client redirects to server `/auth/github`
2. Server redirects to WorkOS authorization URL for GitHub OAuth
3. User authenticates with GitHub and is redirected to server `/auth/callback` with code
4. Server exchanges code via WorkOS, stores user in `req.session.user`, redirects to client
5. Client calls `/auth/me` to hydrate user context from session cookie
6. Protected API calls rely on server-side `requireAuth` middleware (401 if unauthenticated)

### Error Handling

#### Server
- `/auth/github`: catch WorkOS errors, log, respond 500 JSON
- `/auth/callback`: validate code, handle exchange errors, respond 400/500
- `/auth/logout`: destroy session; on error respond 500
- Global error handler: log concisely, avoid leaking secrets

#### Client
- UserContext: on `/auth/me` failure, set user=null
- logout(): always clear local user even if server errors
- Handle 401 from protected calls by prompting login

### Security Considerations

#### Cookies
- `httpOnly: true` to prevent JS access
- `secure: true` in production with `app.set('trust proxy', 1)`
- `sameSite: 'lax'` in production

#### Session Store
- Default MemoryStore is NOT for production
- Use persistent store (connect-redis or SQLite store) for production

#### Secrets
- Keep SESSION_SECRET, WORKOS_API_KEY out of source control
- Use environment injection

#### CORS
- Restrict origin to `process.env.CLIENT_ORIGIN`
- `credentials: true`

#### Redirect URIs
- Ensure `WORKOS_REDIRECT_URI` exactly matches WorkOS dashboard configuration

#### Authorization
- Keep `requireAuth` on all write/generate endpoints

#### PII
- Store only minimal user fields in session
- Do not log tokens or full WorkOS payloads

### Testing Checklist
- [ ] Start backend with `.env` configured
- [ ] Start frontend with `VITE_API_BASE_URL` set
- [ ] Click "Sign in with GitHub" → GitHub auth → redirected to client
- [ ] Refresh page; user menu shows name/avatar; `/auth/me` returns 200
- [ ] Hit protected endpoints while authenticated: 200; unauthenticated: 401
- [ ] Sign out: user cleared; `/auth/me` returns 401

### Risks and Guardrails
- MemoryStore is not production-ready; switch to persistent session store before deploying
- Misconfigured redirect URIs or WorkOS env values will cause 400/500 during callback
- Cookie secure/sameSite misconfig can break auth in prod; test behind HTTPS and reverse proxy

### Optional Advanced Enhancements
- Persist users in SQLite with users table (id, email, first_name, last_name, avatar_url, last_login_at)
- On `/auth/callback`, upsert user in DB; store only user.id in session
- Add RBAC claims and authorization middleware
- Switch to Redis-backed sessions for horizontal scaling
- Add CSRF tokens for state-changing routes if exposing forms across domains
