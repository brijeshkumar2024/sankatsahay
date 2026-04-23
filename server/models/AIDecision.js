import mongoose from "mongoose";

const aiDecisionSchema = new mongoose.Schema(
  {
    decisionType: {
      type: String,
      enum: ["resource_prediction", "volunteer_assignment", "emotion_detection", "traffic_route", "other"],
      required: true
    },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    explanation: { type: String, default: "" },
    payload: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

aiDecisionSchema.index({ createdAt: -1 });

export default mongoose.model("AIDecision", aiDecisionSchema);
