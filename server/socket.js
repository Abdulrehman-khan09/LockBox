// socket.js
const Message = require("./models/message.model");
const ComplaintModel = require("./models/complaint.model"); 

function initializeSocket(io) {
  console.log("✅ socket.js initialized");

  io.on("connection", (socket) => {
    console.log(`🔗 User connected: ${socket.id}`);

    // Join case-specific room
    socket.on("join_case", (caseId) => {
      socket.join(caseId);
      console.log(`👥 Socket ${socket.id} joined case room: ${caseId}`);
    });

    // Leave case-specific room
    socket.on("leave_case", (caseId) => {
      socket.leave(caseId);
      console.log(`👋 Socket ${socket.id} left case room: ${caseId}`);
    });

    // Handle new messages
    socket.on("send_message", async (data) => {
      try {
        console.log("📨 Received message:", data);

        // Create new message document
        const newMessage = new Message({
          caseId: data.caseId,
          sender: data.sender,         // 'admin' or 'user'
          senderId: data.senderId,     // Admin ID or null for users
          encryptedMessage: data.encryptedMessage,
          originalText: data.originalText, // optional for sender reference
          timestamp: data.timestamp || new Date()
        });

        // Save to database
        const savedMessage = await newMessage.save();
        console.log(`💾 Message saved: ${savedMessage._id}`);

        // Broadcast to all clients in the case room (including sender)
        io.to(data.caseId).emit("receive_message", {
          _id: savedMessage._id,
          caseId: savedMessage.caseId,
          sender: savedMessage.sender,
          senderId: savedMessage.senderId,
          encryptedMessage: savedMessage.encryptedMessage,
          timestamp: savedMessage.timestamp
        });

        console.log(`📡 Message broadcasted to case room: ${data.caseId}`);
      } catch (error) {
        console.error("❌ Error saving message:", error);
        socket.emit("message_error", {
          error: "Failed to save message",
          details: error.message
        });
      }
    });

    

// inside io.on("connection", ...) add:
socket.on("case_status_update", async (data) => {
  try {
    const { caseId, status, decision, adminId } = data;
    const updated = await ComplaintModel.findByIdAndUpdate(
      caseId,
      { status, decision: decision || null, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (updated) {
      io.to(caseId).emit("case_status_update", {
        caseId,
        status: updated.status,
        decision: updated.decision,
        updatedAt: updated.updatedAt
      });
    }
  } catch (err) {
    console.error("case_status_update error:", err);
    socket.emit("case_update_error", { message: "Failed to update status" });
  }
});

socket.on("case_priority_update", async (data) => {
  try {
    const { caseId, priority, adminId } = data;
    const updated = await ComplaintModel.findByIdAndUpdate(
      caseId,
      { priority, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (updated) {
      io.to(caseId).emit("case_priority_update", {
        caseId,
        priority: updated.priority,
        updatedAt: updated.updatedAt
      });
    }
  } catch (err) {
    console.error("case_priority_update error:", err);
    socket.emit("case_update_error", { message: "Failed to update priority" });
  }
});

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`💔 User disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initializeSocket };
