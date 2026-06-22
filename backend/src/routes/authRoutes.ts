import { Router } from 'express';
import { login, register, getUserByNrp } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/users/by-nrp/:nrp', getUserByNrp);

export default router;
