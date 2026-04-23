import mongoose from "mongoose";

const disasterZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
    disasterType: {
      type: String,
      enum: ["Flood", "Earthquake", "Cyclone", "Fire", "Industrial", "Landslide"],
      default: "Flood"
    },
    center: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }
    },
    polygon: {
      type: [[Number]],
      default: []
    },
    radiusKm: { type: Number, default: 5 },
    aiPrediction: {
      foodParcels: Number,
      waterLiters: Number,
      medicalKits: Number,
      shelterCapacity: Number,
      summary: String,
      confidence: { type: Number, default: 0.8 },
      sources: [{ type: String }],
      generatedAt: Date
    }
  },
  { timestamps: true }
);

disasterZoneSchema.index({ center: "2dsphere" });

export default mongoose.model("DisasterZone", disasterZoneSchema);
