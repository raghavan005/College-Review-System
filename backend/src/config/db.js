const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const connectionString = uri || process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
