import { Router } from 'express';
import { verifyToken, optionalVerifyToken } from '../middleware/auth.js';
import * as partiesController from '../controllers/parties.controller.js';
import * as itemsController from '../controllers/items.controller.js';

const router = Router();

router.get('/categories', partiesController.listCategories);
router.get('/', optionalVerifyToken, partiesController.list);
router.get('/:id', partiesController.get);
router.post('/', verifyToken, partiesController.create);
router.post('/:id/register', verifyToken, partiesController.registerForParty);
router.post('/:id/items', verifyToken, itemsController.addItem);
router.delete('/:id/items/:itemId', verifyToken, itemsController.deleteItem);

export default router;
