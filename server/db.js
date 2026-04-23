import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is required");
    }

    const conn = await mongoose.connect(uri);
    let host = conn.connection.host;
    try {
      host = new URL(uri).host || host;
    } catch {
      // keep mongoose-resolved host fallback
    }
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${host}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
