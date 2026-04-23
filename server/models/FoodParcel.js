import mongoose from "mongoose";

const foodParcelSchema = new mongoose.Schema(
  {
    qrCode: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["Allocated", "In Transit", "Delivered", "Confirmed"],
      default: "Allocated"
    },
    assignedZone: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [85.8245, 20.2961] }
    }
  },
  { timestamps: true }
);

foodParcelSchema.index({ location: "2dsphere" });

export default mongoose.model("FoodParcel", foodParcelSchema);
