import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as usersController from '../controllers/users.controller.js';

const router = Router();

router.get('/me/profile', verifyToken, usersController.getProfile);

export default router;
