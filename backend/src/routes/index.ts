import { Router } from 'express';
import authRoutes from './auth.js';
import partiesRoutes from './parties.js';
import usersRoutes from './users.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/parties', partiesRoutes);
router.use('/users', usersRoutes);

export default router;
