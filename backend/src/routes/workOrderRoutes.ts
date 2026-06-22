import { Router } from 'express';
import { upload } from '../config/upload';
import {
  getStats, getAll, create, getById, updateNoWo, submitApproval,
  startProgress, finishProgress, acknowledgeProgress, uploadSignature
} from '../controllers/workOrderController';

const router = Router();

router.get('/stats', getStats);
router.get('/', getAll);
router.post('/', upload.array('lampiran_temuan'), create);
router.get('/:id', getById);
router.patch('/:id/no-wo', updateNoWo);
router.post('/:id/approval', submitApproval);
router.post('/:id/start', startProgress);
router.post('/:id/progress', upload.single('lampiran_hasil'), finishProgress);
router.post('/:id/acknowledge', acknowledgeProgress);

export default router;

export const uploadRouter = Router();
uploadRouter.post('/upload-signature', upload.single('signature'), uploadSignature);
