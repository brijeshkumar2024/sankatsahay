import mongoose from "mongoose";

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    medicalAvailable: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    accessibility: { type: Boolean, default: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    }
  },
  { timestamps: true }
);

shelterSchema.index({ location: "2dsphere" });

export default mongoose.model("Shelter", shelterSchema);
