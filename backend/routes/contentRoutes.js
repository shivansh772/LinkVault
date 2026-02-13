import express from 'express';
import { uploadContent, getContent, deleteContent, getContentMetadata } from '../controllers/contentController.js';
import upload from '../middleware/upload.js';
import { validateUpload, validatePassword } from '../middleware/validation.js';

const router = express.Router();

// Upload content (text or file)
router.post(
  '/upload',
  upload.single('file'),
  validateUpload,
  validatePassword,
  uploadContent
);

// Get content metadata (lightweight check)
router.get('/:shortId/metadata', getContentMetadata);

// Get content by short ID
router.get('/:shortId', getContent);

// Delete content manually
router.delete('/:shortId', deleteContent);

export default router;
