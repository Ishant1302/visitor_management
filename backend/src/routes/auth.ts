import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', authenticate, register); // Admin only - enforced in controller
router.get('/me', authenticate, getMe);

export default router;
