import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    zoneName: String,
    type: { type: String, enum: ["food", "water", "medical", "shelter"], required: true },
    quantity: { type: Number, default: 0 },
    priority: { type: Number, min: 1, max: 5, default: 3 }
  },
  { timestamps: true }
);

export default mongoose.model("Resource", resourceSchema);
