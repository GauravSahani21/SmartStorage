import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/rooms — list rooms you own or are a member of
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name')
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rooms — create a room
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPublic, expiresAt } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const room = await Room.create({
      name,
      description: description || '',
      owner: req.user._id,
      members: [req.user._id],
      isPublic: isPublic || false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      inviteCode: uuidv4().slice(0, 8).toUpperCase(),
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/:id — get room details
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('documents');

    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isMember = room.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember && !room.isPublic) return res.status(403).json({ message: 'Access denied' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rooms/:id/join — join via invite code
router.post('/join/:code', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Invalid invite code' });

    const alreadyMember = room.members.some((m) => m.toString() === req.user._id.toString());
    if (!alreadyMember) {
      room.members.push(req.user._id);
      await room.save();
    }
    res.json({ message: 'Joined room', roomId: room._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rooms/:id/documents — add a document to the room
router.post('/:id/documents', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isMember = room.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const { documentId } = req.body;
    const doc = await Document.findOne({ _id: documentId, owner: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (!room.documents.includes(documentId)) {
      room.documents.push(documentId);
      await room.save();
    }
    res.json({ message: 'Document added to room' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/rooms/:id — delete room (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
    if (!room) return res.status(404).json({ message: 'Room not found or not authorized' });
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
