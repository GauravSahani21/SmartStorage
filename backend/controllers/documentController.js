import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import Document from '../models/Document.js';
import ViewLog from '../models/ViewLog.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import { classifyDocument, summarizeText } from '../utils/aiClassifier.js';
import { generateShareQR } from '../utils/qr.js';
import { watermarkPDF, watermarkImage } from '../utils/watermark.js';

/**
 * Returns the document if the requesting user is either:
 *   a) the owner  OR
 *   b) a member of any room that contains this document
 * Returns null otherwise.
 */
async function canAccessDocument(docId, userId) {
  // Owner check
  let doc = await Document.findOne({ _id: docId, owner: userId });
  if (doc) return { doc, isOwner: true };

  // Room-member check
  doc = await Document.findById(docId);
  if (!doc) return null;

  const roomWithDoc = await Room.findOne({
    documents: docId,
    members: userId,
  });
  if (roomWithDoc) return { doc, isOwner: false };

  return null;
}

// Helper: get GridFS bucket
const getBucket = () => {
  const db = mongoose.connection.db;
  return new GridFSBucket(db, { bucketName: 'documents' });
};

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, category, year, institution, tags, expiresAt } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Document title is required' });
    }

    // Check storage limit
    const user = await User.findById(req.user._id);
    if (user.storageUsed + req.file.size > user.storageLimit) {
      return res.status(400).json({ message: 'Storage limit exceeded. You have used 500MB.' });
    }

    const bucket = getBucket();
    const filename = `${uuidv4()}-${req.file.originalname}`;

    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        owner: req.user._id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      uploadStream.end(req.file.buffer);
    });

    const fileId = uploadStream.id;
    const parsedTags = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    // ── AI Auto-Categorization ───────────────────────────────────
    let finalCategory = category || 'other';
    let finalTags = parsedTags;
    let aiCategorized = false;

    // Only run AI if user didn't explicitly set a non-default category
    if (!category || category === 'other') {
      const aiResult = await classifyDocument(req.file.originalname, req.file.mimetype, title);
      finalCategory = aiResult.category;
      if (parsedTags.length === 0) finalTags = aiResult.tags;
      aiCategorized = true;
    }
    // ─────────────────────────────────────────────────────────────

    const document = await Document.create({
      owner: req.user._id,
      title,
      description: description || '',
      category: finalCategory,
      aiCategorized,
      fileId,
      filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      year: year || '',
      institution: institution || user.institution || '',
      tags: finalTags,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    });

    // Update user storage
    user.storageUsed += req.file.size;
    await user.save();

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all documents for authenticated user
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    const { category, year, search, sort = 'newest' } = req.query;

    const query = { owner: req.user._id };

    if (category && category !== 'all') query.category = category;
    if (year) query.year = year;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { institution: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { title: 1 },
      name_desc: { title: -1 },
      size_desc: { fileSize: -1 },
    };

    const documents = await Document.find(query)
      .sort(sortOptions[sort] || sortOptions.newest)
      .select('-__v');

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single document metadata
// @route   GET /api/documents/:id
// @access  Private (owner OR room member)
export const getDocument = async (req, res) => {
  try {
    const access = await canAccessDocument(req.params.id, req.user._id);
    if (!access) return res.status(404).json({ message: 'Document not found' });

    // If viewer is not the owner, strip sensitive sharing fields
    const data = access.doc.toObject();
    if (!access.isOwner) {
      delete data.shareToken;
      delete data.qrCode;
      data._roomAccess = true; // hint for UI to show read-only mode
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stream a document file
// @route   GET /api/documents/:id/file
// @access  Private (owner OR room member)
export const streamDocument = async (req, res) => {
  try {
    const access = await canAccessDocument(req.params.id, req.user._id);
    if (!access) return res.status(404).json({ message: 'Document not found' });

    const { doc: document } = access;
    const bucket = getBucket();

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);

    const downloadStream = bucket.openDownloadStream(document.fileId);
    downloadStream.on('error', () => {
      res.status(404).json({ message: 'File not found in storage' });
    });
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update document metadata
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const { title, description, category, year, institution, tags } = req.body;

    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (year !== undefined) document.year = year;
    if (institution !== undefined) document.institution = institution;
    if (tags !== undefined) {
      document.tags = typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : tags;
    }

    const updatedDoc = await document.save();
    res.json(updatedDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete from GridFS
    const bucket = getBucket();
    try {
      await bucket.delete(document.fileId);
    } catch (gridfsError) {
      console.warn('GridFS delete warning:', gridfsError.message);
    }

    // Update user storage
    const user = await User.findById(req.user._id);
    user.storageUsed = Math.max(0, user.storageUsed - document.fileSize);
    await user.save();

    await document.deleteOne();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate shareable link + QR for a document
// @route   POST /api/documents/:id/share
// @access  Private
export const shareDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, owner: req.user._id });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const shareToken = uuidv4();
    const expiryDays = req.body.expiryDays || 7;
    const enableWatermark = req.body.watermark === true;
    const recipientLabel = req.body.recipientLabel || '';

    document.isShared = true;
    document.shareToken = shareToken;
    document.shareExpiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    document.shareWatermark = enableWatermark;
    document.shareRecipientLabel = recipientLabel;

    // Generate QR code pointing to verify page
    document.qrCode = await generateShareQR(shareToken, process.env.CLIENT_URL);

    await document.save();

    const shareLink = `${process.env.CLIENT_URL}/shared/${shareToken}`;
    res.json({ shareLink, shareToken, expiresAt: document.shareExpiresAt, qrCode: document.qrCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke share link
// @route   DELETE /api/documents/:id/share
// @access  Private
export const revokeShare = async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        $set: { isShared: false, shareWatermark: false, shareRecipientLabel: '' },
        $unset: { shareToken: '', shareExpiresAt: '', qrCode: '' },
      },
      { new: true }
    );

    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Share link revoked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    View shared document metadata (public) — logs access
// @route   GET /api/documents/shared/:token
// @access  Public
export const getSharedDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareToken: req.params.token,
      isShared: true,
    }).populate('owner', 'name institution');

    if (!document) return res.status(404).json({ message: 'Shared document not found or link has been revoked' });
    if (document.shareExpiresAt && new Date() > document.shareExpiresAt) {
      return res.status(410).json({ message: 'This share link has expired' });
    }

    // Log this view (fire-and-forget)
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    ViewLog.create({
      document: document._id,
      ip,
      userAgent: req.headers['user-agent'] || '',
    }).catch(() => {});

    res.json({
      _id: document._id,
      title: document.title,
      description: document.description,
      category: document.category,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      year: document.year,
      institution: document.institution,
      owner: document.owner,
      shareExpiresAt: document.shareExpiresAt,
      createdAt: document.createdAt,
      shareToken: document.shareToken,
      qrCode: document.qrCode,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Stream shared document file (with optional watermark)
// @route   GET /api/documents/shared/:token/file
// @access  Public
export const streamSharedDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ shareToken: req.params.token, isShared: true });
    if (!document) return res.status(404).json({ message: 'Shared document not found' });
    if (document.shareExpiresAt && new Date() > document.shareExpiresAt) {
      return res.status(410).json({ message: 'This share link has expired' });
    }

    const bucket = getBucket();

    // Collect file buffer for potential watermarking
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(document.fileId);

    downloadStream.on('error', () => res.status(404).json({ message: 'File not found in storage' }));
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('end', async () => {
      let fileBuffer = Buffer.concat(chunks);

      // Apply watermark if enabled
      if (document.shareWatermark) {
        const label = document.shareRecipientLabel || 'StudentVault';
        const watermarkText = `Shared via StudentVault • ${label}`;
        try {
          if (document.mimeType === 'application/pdf') {
            fileBuffer = await watermarkPDF(fileBuffer, watermarkText);
          } else if (document.mimeType.startsWith('image/')) {
            fileBuffer = await watermarkImage(fileBuffer, document.mimeType, watermarkText);
          }
        } catch (wmErr) {
          console.warn('Watermark failed, sending original:', wmErr.message);
        }
      }

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.send(fileBuffer);
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get document stats for dashboard + analytics
// @route   GET /api/documents/stats
// @access  Private
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [totalDocs, categoryBreakdown, user, uploadsByMonth, expiringCount] = await Promise.all([
      Document.countDocuments({ owner: userId }),
      Document.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: '$category', count: { $sum: 1 }, size: { $sum: '$fileSize' } } },
      ]),
      User.findById(userId),
      // Uploads grouped by month (last 12 months)
      Document.aggregate([
        { $match: { owner: userId, createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Document.countDocuments({ owner: userId, expiresAt: { $gt: now, $lte: thirtyDaysLater } }),
    ]);

    res.json({
      totalDocuments: totalDocs,
      storageUsed: user.storageUsed,
      storageLimit: user.storageLimit,
      categoryBreakdown,
      uploadsByMonth,
      expiringCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    AI Summarize a document
// @route   POST /api/documents/:id/summarize
// @access  Private
export const summarizeDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, owner: req.user._id });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // Return cached summary
    if (document.aiSummary) {
      return res.json({ summary: document.aiSummary, cached: true });
    }

    if (document.mimeType !== 'application/pdf') {
      return res.status(400).json({ message: 'AI summarization is only available for PDF documents.' });
    }

    // Fetch PDF buffer from GridFS
    const bucket = getBucket();
    const chunks = [];
    await new Promise((resolve, reject) => {
      const stream = bucket.openDownloadStream(document.fileId);
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    const pdfBuffer = Buffer.concat(chunks);

    // Extract text with pdf-parse
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    const summary = await summarizeText(text, document.title);

    // Cache the summary
    document.aiSummary = summary;
    document.aiSummaryAt = new Date();
    await document.save();

    res.json({ summary, cached: false });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Academic timeline — documents grouped by year
// @route   GET /api/documents/timeline
// @access  Private
export const getTimeline = async (req, res) => {
  try {
    const userId = req.user._id;
    const timeline = await Document.aggregate([
      { $match: { owner: userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $ifNull: ['$year', 'Unknown'] },
          docs: { $push: '$$ROOT' },
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Documents expiring within N days
// @route   GET /api/documents/expiring?days=30
// @access  Private
export const getExpiringDocs = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const docs = await Document.find({
      owner: req.user._id,
      expiresAt: { $gt: now, $lte: future },
    }).sort({ expiresAt: 1 }).select('title category expiresAt mimeType');
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get view logs for a document (owner only)
// @route   GET /api/documents/:id/views
// @access  Private
export const getViewLogs = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, owner: req.user._id });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    const logs = await ViewLog.find({ document: document._id })
      .sort({ viewedAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify a shared document (public — for QR scan)
// @route   GET /api/documents/verify/:token
// @access  Public
export const verifyDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareToken: req.params.token,
      isShared: true,
    }).populate('owner', 'name institution');

    if (!document) return res.status(404).json({ message: 'Document not found or link revoked' });
    if (document.shareExpiresAt && new Date() > document.shareExpiresAt) {
      return res.status(410).json({ message: 'This link has expired' });
    }

    res.json({
      verified: true,
      title: document.title,
      category: document.category,
      institution: document.institution || document.owner?.institution || '',
      ownerName: document.owner?.name || '',
      uploadedAt: document.createdAt,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      shareExpiresAt: document.shareExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
