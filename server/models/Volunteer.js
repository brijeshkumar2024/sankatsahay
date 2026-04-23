import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skills: [{ type: String }],
    trustScore: { type: Number, default: 50 },
    credits: { type: Number, default: 0 },
    status: { type: String, enum: ["available", "assigned", "offline"], default: "available" },
    availability: { type: Boolean, default: true },
    language: { type: String, default: "en" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [85.8245, 20.2961] }
    }
  },
  { timestamps: true }
);

volunteerSchema.index({ location: "2dsphere" });

export default mongoose.model("Volunteer", volunteerSchema);
