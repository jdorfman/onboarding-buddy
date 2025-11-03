# PRD: WorkOS GitHub Authentication Implementation

## Overview
Implement server-side OAuth authentication using WorkOS for GitHub sign-in. The server handles the complete OAuth flow and maintains user sessions via cookies. The React client interacts with auth endpoints using session cookies.

## Critical Implementation Notes

### Architecture Decision: Server-Side OAuth
- **Server initiates and completes OAuth** (not client-side)
- **Session storage**: User stored in `req.session.user` (server-side session)
- **Client communication**: Session cookies with `withCredentials: true`
- **No JWT tokens**: Sessions are managed by express-session

### Environment: ES Modules
This implementation uses ES modules (`"type": "module"` in package.json). This affects how environment variables are loaded.

**CRITICAL:** With ES modules, `dotenv.config()` MUST be called before any imports that depend on env vars. When route files import and initialize clients (like WorkOS) at module scope, those imports execute BEFORE the rest of server.ts runs.

**Solution:** Use lazy initialization - create WorkOS client inside route handlers, not at module scope.

## Dependencies

### Server (Add to existing package.json)
```json
{
  "dependencies": {
    "@workos-inc/node": "^7.26.0",
    "express-session": "^1.17.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express-session": "latest"
  }
}
```

### Client (Add to existing package.json)
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react-router-dom": "^7.9.4"
  }
}
```

## Environment Configuration

### Server `.env` (server/.env)
```bash
PORT=3001
SESSION_SECRET=your-random-secret-at-least-32-chars
CLIENT_ORIGIN=http://localhost:3000
WORKOS_API_KEY=sk_test_your_workos_api_key
WORKOS_CLIENT_ID=client_your_workos_client_id
WORKOS_REDIRECT_URI=http://localhost:3001/auth/callback
```

### Client `.env` (client/.env)
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### WorkOS Dashboard Setup
1. Create project, enable **User Management**
2. Add **GitHub** as OAuth connection
3. Set Redirect URI: `http://localhost:3001/auth/callback`
4. Copy **API Key** and **Client ID** to server `.env`

**Note on Provider:** WorkOS uses AuthKit as the provider even when using GitHub OAuth. The provider parameter should be `'authkit'`, not `'github'`.

## Server Implementation

### 1. TypeScript Session Types
**File:** `server/src/types/session.d.ts`

```typescript
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
    };
  }
}
```

### 2. Server Configuration
**File:** `server/src/server.ts`

```typescript
import dotenv from 'dotenv';
dotenv.config(); // MUST be first - before all other imports

import express from 'express';
import cors from 'cors';
import session from 'express-session';
// ... other imports

const app = express();

// CORS with credentials
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Trust proxy in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());

// Mount auth routes
app.use('/auth', authRouter);
```

### 3. Auth Routes
**File:** `server/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { WorkOS } from '@workos-inc/node';

const router = Router();

// Lazy initialization to ensure env vars are loaded
const getWorkOS = () => new WorkOS(process.env.WORKOS_API_KEY!);
const getClientId = () => process.env.WORKOS_CLIENT_ID!;
const getRedirectUri = () => process.env.WORKOS_REDIRECT_URI!;

// GET /auth/github - Initiate OAuth
router.get('/github', (req, res) => {
  try {
    const workos = getWorkOS();
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      provider: 'authkit', // Note: 'authkit' not 'github'
      clientId: getClientId(),
      redirectUri: getRedirectUri(),
    });

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Failed to initiate authentication:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
});

// GET /auth/callback - Complete OAuth
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  try {
    const workos = getWorkOS();
    const { user } = await workos.userManagement.authenticateWithCode({
      code,
      clientId: getClientId(),
    });

    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      profilePicture: user.profilePictureUrl ?? undefined,
    };

    res.redirect(process.env.CLIENT_ORIGIN || 'http://localhost:3000');
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /auth/me - Get current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json(req.session.user);
});

// POST /auth/logout - End session
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout failed:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

export default router;
```

### 4. Auth Middleware
**File:** `server/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};
```

### 5. Protect Endpoints
In each route file that has POST/DELETE endpoints:

```typescript
import { requireAuth } from '../middleware/auth.js';

// Apply to write operations
router.post('/generate', requireAuth, async (req, res) => { /* ... */ });
router.delete('/:id', requireAuth, async (req, res) => { /* ... */ });
```

## Client Implementation

### 1. Axios Instance
**File:** `client/src/api/http.ts`

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true, // Required for cookies
});
```

### 2. Auth Types
**File:** `client/src/types/auth.ts`

```typescript
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};
```

### 3. User Context
**File:** `client/src/contexts/UserContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/http';
import { User } from '../types/auth';

type UserContextType = {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
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

### 4. Wrap App with Provider
**File:** `client/src/main.tsx`

```typescript
import { UserProvider } from './contexts/UserContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
```

### 5. UserMenu Component
**File:** `client/src/components/UserMenu.tsx`

```typescript
import React from 'react';
import { useUser } from '../contexts/UserContext';

const GitHubIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" fill="white"/>
  </svg>
);

export const UserMenu: React.FC = () => {
  const { user, loading, login, logout } = useUser();

  if (loading) {
    return (
      <div className="d-none d-md-flex align-items-center">
        <div className="spinner-border spinner-border-sm text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={login}
        className="btn btn-dark d-none d-md-flex align-items-center gap-2"
        style={{
          border: '1px solid white',
          padding: '6px 16px',
        }}
      >
        <GitHubIcon />
        <span>Sign in with GitHub</span>
      </button>
    );
  }

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email;
  };

  return (
    <div className="dropdown d-none d-md-block">
      <button
        className="btn btn-link p-0 border-0"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={{ textDecoration: 'none' }}
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="User avatar"
            className="rounded-circle"
            style={{ width: '32px', height: '32px' }}
          />
        ) : (
          <div
            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px', fontSize: '12px', fontWeight: 'bold' }}
          >
            {getInitials()}
          </div>
        )}
      </button>
      <ul className="dropdown-menu dropdown-menu-end">
        <li>
          <h6 className="dropdown-header">{getDisplayName()}</h6>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button className="dropdown-item" onClick={logout}>
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
};
```

### 6. Add to Navbar
In your existing navbar component:

```typescript
import { UserMenu } from './components/UserMenu';

// Inside navbar, after existing nav items:
<div className="collapse navbar-collapse" id="navbarNav">
  <ul className="navbar-nav">
    {/* existing nav items */}
  </ul>
  <div className="ms-auto">
    <UserMenu />
  </div>
</div>
```

## Authentication Flow

1. User clicks "Sign in with GitHub" → client redirects to server `/auth/github`
2. Server generates WorkOS authorization URL, redirects to WorkOS
3. WorkOS redirects to GitHub OAuth
4. User authenticates with GitHub
5. GitHub redirects to WorkOS
6. WorkOS redirects to server `/auth/callback?code=...`
7. Server exchanges code with WorkOS, gets user profile
8. Server stores user in `req.session.user`
9. Server redirects to client (home page)
10. Client calls `/auth/me` on mount to hydrate user context
11. Protected endpoints check `req.session.user` via `requireAuth` middleware

## Testing Checklist

1. **Start server:** `npm run dev` in server directory (in tmux)
2. **Start client:** `npm run dev` in client directory
3. **Verify server:** `curl -I http://localhost:3001/auth/github` should return 302 redirect
4. **Test login flow:**
   - Click "Sign in with GitHub" button (top right, hidden on mobile)
   - Complete GitHub OAuth
   - Should redirect back to home page
   - User avatar/initials should appear in top right
5. **Test persistence:** Refresh page, user should remain logged in
6. **Test protected endpoints:**
   - When logged in: POST requests return 200
   - When logged out: POST requests return 401
7. **Test logout:**
   - Click dropdown → "Sign out"
   - User cleared, button returns
   - `/auth/me` returns 401

## Common Pitfalls & Solutions

### 1. **"NoApiKeyProvidedException" Error**
**Cause:** WorkOS client initialized at module scope before env vars loaded (ES modules issue)

**Solution:** Use lazy initialization - create clients inside route handlers:
```typescript
// ❌ Wrong
const workos = new WorkOS(process.env.WORKOS_API_KEY);

// ✅ Correct
const getWorkOS = () => new WorkOS(process.env.WORKOS_API_KEY!);
```

### 2. **Session not persisting across requests**
**Cause:** Missing `withCredentials: true` on client axios config

**Solution:** Set in axios instance:
```typescript
export const api = axios.create({
  baseURL: '...',
  withCredentials: true, // Required
});
```

### 3. **CORS errors in browser**
**Cause:** CORS not configured for credentials

**Solution:** Server must set both:
```typescript
app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true, // Required
}));
```

### 4. **Cookies not set in production**
**Cause:** Missing `secure: true` and `trust proxy` config

**Solution:**
```typescript
app.use(session({
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    // ...
  },
}));

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```

### 5. **"Cannot GET /auth/github" 404 error**
**Cause:** Auth router not mounted or server crashed

**Solution:** Verify:
- `app.use('/auth', authRouter)` in server.ts
- Check server logs for startup errors
- Ensure port 3001 is not already in use

### 6. **Provider parameter confusion**
**Cause:** Using `provider: 'github'` instead of `provider: 'authkit'`

**Solution:** WorkOS uses AuthKit as the provider even for GitHub OAuth:
```typescript
workos.userManagement.getAuthorizationUrl({
  provider: 'authkit', // Not 'github'
  clientId,
  redirectUri,
});
```

## Critique of Original Instructions

### What Worked Well
✅ Provided comprehensive reference implementation (workos.md)
✅ Clear separation of server vs client concerns
✅ Security considerations documented
✅ Environment variable setup detailed

### What Could Be Improved

1. **Module System Context Missing**
   - Original guide didn't specify ES modules vs CommonJS
   - No warning about dotenv.config() timing with ES modules
   - Should explicitly state: "If using ES modules, use lazy initialization"

2. **Provider Parameter Ambiguity**
   - Guide showed `provider: 'authkit'` but context suggested GitHub
   - Should clarify: "WorkOS uses 'authkit' as provider regardless of OAuth connection type"
   - Include note: "The GitHub connection is configured in WorkOS dashboard, not in code"

3. **Testing Instructions Incomplete**
   - No curl command to verify server endpoint
   - Missing step to check server logs for env var loading
   - Should include: "Verify with: `curl -I http://localhost:3001/auth/github` → expect 302"

4. **Debugging Guidance Missing**
   - No troubleshooting section
   - Should include common errors and solutions upfront
   - Add: "If you see NoApiKeyProvidedException, use lazy initialization"

5. **Button Specifications Too Detailed Too Early**
   - Asking about SVG source and mobile behavior before implementation started
   - Better: Provide defaults, allow iteration after basic flow works
   - Suggested flow: "Get auth working first, then refine UI"

6. **No Build Step Mentioned**
   - TypeScript projects need compilation
   - Should specify: "Run `npm run build` if using compiled output"
   - Or: "Use tsx/ts-node for development with TypeScript"

### Recommended Prompt Structure

For best results with AI assistants, provide:

1. **Context first:**
   ```
   - Project type: React + Express
   - Module system: ES modules (type: "module")
   - TypeScript: Yes
   - CSS framework: Bootstrap 5
   ```

2. **Goal second:**
   ```
   Implement WorkOS GitHub authentication with server-side OAuth.
   Requirements:
   - Server handles OAuth flow
   - Session-based auth (no JWT)
   - Protected API endpoints
   - User avatar dropdown in navbar
   ```

3. **Constraints third:**
   ```
   - Must work with existing CORS setup
   - Should hide button on mobile
   - Use inline SVG (no new icon dependencies)
   ```

4. **Reference last:**
   ```
   See attached PRD.md for complete implementation guide.
   Ask questions before implementing if anything is unclear.
   ```

## Production Considerations

### Session Store
- **MemoryStore is NOT production-ready** (server restart = all sessions lost)
- Use persistent store: `connect-redis`, `connect-session-sequelize`, or `better-sqlite3-session-store`
- Example with Redis:
  ```typescript
  import RedisStore from 'connect-redis';
  import { createClient } from 'redis';
  
  const redisClient = createClient();
  await redisClient.connect();
  
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    // ... other options
  }));
  ```

### Environment Variables
- Never commit secrets to version control
- Use secret management: AWS Secrets Manager, Vault, Doppler
- Rotate `SESSION_SECRET` regularly
- Use different WorkOS projects for dev/staging/prod

### HTTPS & Cookies
- Production MUST use HTTPS
- Set `cookie.secure: true` in production
- Configure reverse proxy (nginx/cloudflare) to set proper headers
- Verify `trust proxy` setting matches proxy configuration

### Error Handling
- Don't leak error details to client in production
- Log errors to monitoring service (Sentry, DataDog)
- Return generic error messages to users

## Additional Features (Optional)

### Email/Password Authentication
WorkOS supports multiple auth methods. Add email/password:
```typescript
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  clientId,
  redirectUri,
  // AuthKit will show email/password + social options
});
```

### Role-Based Access Control
Extend user session with roles:
```typescript
req.session.user = {
  ...user,
  role: 'admin', // or 'user', etc.
};

// Middleware
export const requireRole = (role: string) => (req, res, next) => {
  if (req.session?.user?.role !== role) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### Refresh User Data
Periodically sync user data from WorkOS:
```typescript
// In auth routes
router.post('/refresh', requireAuth, async (req, res) => {
  const workos = getWorkOS();
  const user = await workos.userManagement.getUser(req.session.user!.id);
  
  req.session.user = {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    profilePicture: user.profilePictureUrl ?? undefined,
  };
  
  res.json(req.session.user);
});
```

## License
This implementation guide is provided as-is for educational purposes. Adapt to your project's needs.
