const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');

const router = express.Router();

// POST /rooms — create room record
router.post('/', async (req, res) => {
  try {
    const { roomId, name, createdBy } = req.body;
    if (!roomId || !name || !createdBy) return res.status(400).json({ error: 'roomId, name and createdBy required' });
    const room = await Room.create({ roomId, name, createdBy, members: [createdBy] });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms?createdBy=userId — rooms created by user
router.get('/', async (req, res) => {
  try {
    const { createdBy } = req.query;
    if (!createdBy) return res.status(400).json({ error: 'createdBy required' });
    const rooms = await Room.find({ createdBy }).sort({ lastActiveAt: -1 });
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /rooms/:roomId — get room by roomId
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /rooms/:roomId — update code/language/problemId/members/lastActiveAt
router.patch('/:roomId', async (req, res) => {
  try {
    const { addMember, ...fields } = req.body;
    const update = { ...fields, lastActiveAt: new Date() };
    if (addMember) update.$addToSet = { members: addMember };
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      addMember ? { $set: fields, $addToSet: { members: addMember }, lastActiveAt: new Date() } : { $set: update },
      { new: true }
    );
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /rooms/:roomId — delete room and its messages
router.delete('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    await Message.deleteMany({ roomId: req.params.roomId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
