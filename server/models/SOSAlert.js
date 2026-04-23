import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mode: { type: String, enum: ["tap", "voice", "manual", "auto"], default: "manual" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "high" },
    message: String,
    disasterType: {
      type: String,
      enum: ["Flood", "Earthquake", "Cyclone", "Fire", "Industrial", "Landslide"],
      default: "Flood"
    },
    status: { type: String, enum: ["active", "responding", "resolved"], default: "active" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    }
  },
  { timestamps: true }
);

sosAlertSchema.index({ location: "2dsphere" });

export default mongoose.model("SOSAlert", sosAlertSchema);
