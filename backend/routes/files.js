import express from 'express';
import { uploadFile, deleteFile } from '../controllers/files.js';
import authMiddleware from '../middleware/auth.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/:botId', authMiddleware, upload.single('file'), uploadFile);
router.delete('/:botId/:filename', authMiddleware, deleteFile);

export default router;
