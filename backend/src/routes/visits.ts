import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  createVisit,
  getMyVisits,
  cancelVisit,
  getVisitById,
  updateVisit,
} from '../controllers/visitsController';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('MEMBER'), createVisit);
router.get('/my', requireRole('MEMBER'), getMyVisits);
router.get('/:id', getVisitById);
router.patch('/:id/cancel', requireRole('MEMBER'), cancelVisit);
router.patch('/:id', requireRole('MEMBER', 'GUARD', 'ADMIN'), updateVisit);

export default router;
