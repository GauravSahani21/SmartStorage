import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    pendingInvites: [String], // email addresses
    documents: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }
    ],
    isPublic: { type: Boolean, default: false },
    expiresAt: { type: Date },
    inviteCode: { type: String, unique: true, sparse: true }, // short join code
  },
  { timestamps: true }
);

roomSchema.index({ owner: 1 });
roomSchema.index({ members: 1 });

const Room = mongoose.model('Room', roomSchema);
export default Room;
