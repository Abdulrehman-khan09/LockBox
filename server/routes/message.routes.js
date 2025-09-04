// routes/message.routes.js
const express = require('express');
const router = express.Router();
const MessageModel = require('../models/message.model');

// GET /api/messages/:caseId - Fetch all messages for a case
router.get('/getmessage', async (req, res) => {
  try {
    const { caseId } = req.query;
    
    console.log(`📩 Fetching messages for case: ${caseId}`);
    
    // Find all messages for this case, sorted by timestamp (oldest first)
    const messages = await MessageModel.find({ caseId })
      .sort({ timestamp: 1 })
      .lean();
    
    console.log(`✅ Found ${messages.length} messages for case ${caseId}`);
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

module.exports = router;