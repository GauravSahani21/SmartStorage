import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  streamDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  revokeShare,
  getSharedDocument,
  streamSharedDocument,
  getStats,
  summarizeDocument,
  getTimeline,
  getExpiringDocs,
  getViewLogs,
  verifyDocument,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// ── Public routes (MUST be before /:id routes) ───────────────────────────────
router.get('/shared/:token', getSharedDocument);
router.get('/shared/:token/file', streamSharedDocument);
router.get('/verify/:token', verifyDocument);

// ── Protected aggregation routes (MUST be before /:id) ───────────────────────
router.get('/stats',    protect, getStats);
router.get('/timeline', protect, getTimeline);
router.get('/expiring', protect, getExpiringDocs);

// ── Upload & list ─────────────────────────────────────────────────────────────
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/',        protect, getDocuments);

// ── Single document CRUD ──────────────────────────────────────────────────────
router.get('/:id',        protect, getDocument);
router.get('/:id/file',   protect, streamDocument);
router.put('/:id',        protect, updateDocument);
router.delete('/:id',     protect, deleteDocument);

// ── Features ──────────────────────────────────────────────────────────────────
router.post('/:id/share',       protect, shareDocument);
router.delete('/:id/share',     protect, revokeShare);
router.post('/:id/summarize',   protect, summarizeDocument);
router.get('/:id/views',        protect, getViewLogs);

export default router;
