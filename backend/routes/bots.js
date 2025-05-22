import express from 'express';
import { getBots, createBot, toggleBot } from '../controllers/bots.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getBots);
router.post('/', authMiddleware, createBot);
router.put('/:botId/toggle', authMiddleware, toggleBot);

export default router;
