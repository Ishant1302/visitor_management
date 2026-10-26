import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getStats,
  searchVisitors,
  getCurrentlyInside,
  checkIn,
  checkOut,
  createWalkIn,
  verifyVisitor,
} from '../controllers/guardController';

const router = Router();

router.use(authenticate);
router.use(requireRole('GUARD', 'ADMIN'));

router.get('/stats', getStats);
router.get('/search', searchVisitors);
router.get('/currently-inside', getCurrentlyInside);
router.post('/walkin', createWalkIn);
router.patch('/visits/:id/checkin', checkIn);
router.patch('/visits/:id/checkout', checkOut);
router.patch('/visits/:id/verify', verifyVisitor);

export default router;
