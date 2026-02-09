import { Router } from 'express';
import { authService } from '../services/AuthenticationService';
import { validate, loginSchema } from '../middleware/validationMiddleware';
import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Login endpoint with rate limiting
router.post('/login', rateLimitMiddleware, validate(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);

    res.json({
      message: 'Login successful',
      token: result.token,
      admin: result.admin
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7) || '';

    await authService.logout(token);

    res.json({
      message: 'Logout successful'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
});

// Verify token endpoint
router.get('/verify', authMiddleware, async (req, res) => {
  res.json({
    message: 'Token is valid',
    admin: (req as any).admin
  });
});

export default router;
