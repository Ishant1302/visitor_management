import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getAdminStats,
  getAnalytics,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getMembers,
  updateMember,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/members', getMembers);
router.patch('/members/:id', updateMember);

export default router;
