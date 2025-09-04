const mongoose = require('mongoose')

const mongoDb =  async () => {
    try {
      const connectToDb = await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ MongoDB Connected: ${connectToDb.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB connection error: ${error.message}`);
    }
  };

  module.exports = mongoDb;

