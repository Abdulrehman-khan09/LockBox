const mongoose = require('mongoose');

const ComplaintFormSchema = new mongoose.Schema({
 
    adminId: { 
      type:String,
      required: true
    },
    
  
     category: { 
      type: String, 
      required: true
     },
     encryptedData: { 
      type: String,
      required: true
     },
    userPublicKey: {
      type: String, 
      required: true
    },
    createdAt: { type: Date, 
      default: Date.now 
    },
    // add inside schema object
status: { type: String, enum: ['pending','ongoing','resolved','closed'], default: 'pending' },
priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
decision: { type: String, enum: ['justified','not_justified', null], default: null },
updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ComplaintForm', ComplaintFormSchema);
