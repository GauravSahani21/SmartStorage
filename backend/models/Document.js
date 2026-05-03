import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    category: {
      type: String,
      default: 'Other',
    },
    aiCategorized: { type: Boolean, default: false }, // was category set by AI?

    // GridFS file reference
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },

    year: { type: String, default: '' },
    institution: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },

    // ── Sharing ──────────────────────────────────────────────────
    isShared: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    shareExpiresAt: { type: Date },
    qrCode: { type: String },

    // Watermark
    shareWatermark: { type: Boolean, default: false },
    shareRecipientLabel: { type: String, default: '' },

    // ── Validity Tracking ────────────────────────────────────────
    expiresAt: { type: Date },
    isExpired: { type: Boolean, default: false },

    // ── AI Features ──────────────────────────────────────────────
    aiSummary: { type: String },
    aiSummaryAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast queries
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ owner: 1, year: 1 });
documentSchema.index({ expiresAt: 1 }, { sparse: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
