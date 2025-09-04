
const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ComplaintForm",
    required: true,
  },
  sender: { type: String,
     enum: ["admin", "user"], 
     required: true },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  }, // null for user
  encryptedMessage: { type: String, 
    required: true },

  timestamp: { type: Date,
     default:
         Date.now
         }, 
});

const MessageModel = mongoose.model("messages",messageSchema)

module.exports = MessageModel

