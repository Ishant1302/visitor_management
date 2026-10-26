import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getAllRecords } from '../controllers/recordsController';

const router = Router();

router.use(authenticate);
router.get('/', getAllRecords);

export default router;
