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
