import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ["rescue", "food_delivery", "medical", "evacuation", "shelter", "search", "other"],
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "assigned", "in_progress", "completed", "verified", "cancelled"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["critical", "high", "medium", "low"],
    default: "high",
  },
  location: {
    type:        { type: String, default: "Point" },
    coordinates: { type: [Number], default: [85.8245, 20.2961] },
    address:     { type: String },
  },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer" },
  requiredSkills:    [{ type: String }],
  estimatedTime:     { type: String },
  rewardCredits:     { type: Number, default: 10 },
  survivorCount:     { type: Number, default: 0 },
  notes:             { type: String },
  completedAt:       { type: Date },
  verifiedAt:        { type: Date },
  gpsProof: {
    lat:       Number,
    lng:       Number,
    timestamp: Date,
  },
  victimConfirmed: { type: Boolean, default: false },
  createdAt:       { type: Date, default: Date.now },
});

taskSchema.index({ location: "2dsphere" });

export default mongoose.model("Task", taskSchema);
