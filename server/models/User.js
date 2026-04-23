import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "volunteer"], default: "user" },
    language: { type: String, default: "en" },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "or", "bn", "ta", "te", "mr"],
      default: "hi"
    },
    bloodGroup: { type: String, default: "Unknown" },
    familyPin: String,
    photoUrl: String,
    faceDescriptor: { type: [Number], default: [] },
    emergencyContacts: [{ name: String, phone: String }],
    status: {
      type: String,
      enum: ["SAFE", "MISSING", "FOUND", "SOS ACTIVE"],
      default: "SAFE"
    },
    lastKnownLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [85.8245, 20.2961] }
    },
    emotionState: {
      state: { type: String, enum: ["CALM", "ANXIOUS", "PANICKING", "UNRESPONSIVE"], default: "CALM" },
      confidence: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

userSchema.index({ lastKnownLocation: "2dsphere" });

export default mongoose.model("User", userSchema);
