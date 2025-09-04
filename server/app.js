const express = require("express");
const app = express();
require("dotenv").config();
const mongoDb = require("./config/db");
mongoDb();

const cors = require('cors')
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json());

// Import routes
const adminRoutes = require('./routes/admin.routes')
const OrgRoutes = require('./routes/organization.routes')
const ComplaintRoutes = require('./routes/complaint.routes')
const formRoutes = require('./routes/form.routes');
const messageRoutes = require('./routes/message.routes');




app.use('/api/admin', adminRoutes)
app.use('/api/org', OrgRoutes)
app.use('/api/complaint', ComplaintRoutes)
app.use('/api/forms', formRoutes);
app.use('/api/messages', messageRoutes);

// Testing purpose
app.get("/", (req, res) => {
    res.send("LockBox API Server - Running Successfully");
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({ 
        message: "Server is healthy", 
        timestamp: new Date().toISOString() 
    });
});

module.exports = app;