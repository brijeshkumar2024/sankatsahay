import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name:     { type: String, required: true },
    phone:    { type: String, required: true },
    email:    { type: String },
    skills: [{
      type: String,
      enum: ["medical", "rescue", "food", "transport", "tech", "translation", "counseling", "diving", "construction"],
    }],
    location: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [85.8245, 20.2961] },
      address:     { type: String },
    },
    availability: {
      type:    String,
      enum:    ["available", "assigned", "busy", "offline"],
      default: "available",
    },
    trustScore:          { type: Number, default: 50, min: 0, max: 100 },
    credits:             { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    currentTask:         { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    verified:            { type: Boolean, default: false },
    idProof:             { type: String },
    profilePhoto:        { type: String },
    language: {
      type:    String,
      enum:    ["hi", "en", "or", "bn", "ta", "te"],
      default: "hi",
    },
  },
  { timestamps: true }
);

volunteerSchema.index({ location: "2dsphere" });

export default mongoose.model("Volunteer", volunteerSchema);
