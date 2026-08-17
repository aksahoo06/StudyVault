require("dotenv").config({ override: true });

const mongoose = require("mongoose");
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log("MongoDB Connected successfully.");
  } catch (error) {
    console.warn("Cloud Database connection failed:", error.message);
    console.log("Attempting local database fallback (mongodb://127.0.0.1:27017/studyvault)...");
    try {
      await mongoose.connect("mongodb://127.0.0.1:27017/studyvault");
      console.log("MongoDB Connected (Local Fallback)");
    } catch (fallbackError) {
      console.error("Local database fallback failed:", fallbackError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;