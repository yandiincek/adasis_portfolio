import { Router } from 'express';
import {
  getAreas, createArea,
  getJenisBangunan, createJenisBangunan,
  getKepemilikan, createKepemilikan,
  getBangunan, createBangunan
} from '../controllers/masterDataController';

const router = Router();

router.get('/areas', getAreas);
router.post('/areas', createArea);

router.get('/jenis-bangunan', getJenisBangunan);
router.post('/jenis-bangunan', createJenisBangunan);

router.get('/kepemilikan', getKepemilikan);
router.post('/kepemilikan', createKepemilikan);

router.get('/bangunan', getBangunan);
router.post('/bangunan', createBangunan);

export default router;
