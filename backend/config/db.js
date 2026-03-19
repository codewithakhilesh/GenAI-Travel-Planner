const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  mongoose.set("bufferCommands", false);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });

  console.log("[DataBase] MongoDB connected successfully--continued Akhilesh's journey to conquer the world of travel planning!");
}

module.exports = connectDB;