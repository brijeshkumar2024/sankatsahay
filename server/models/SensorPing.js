import mongoose from "mongoose";

const sensorPingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bluetooth", "emotion", "distress"],
      required: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [85.8245, 20.2961] }
    },
    payload: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

sensorPingSchema.index({ location: "2dsphere" });

export default mongoose.model("SensorPing", sensorPingSchema);
