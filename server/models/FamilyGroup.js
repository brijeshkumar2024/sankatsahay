import mongoose from "mongoose";

const familyGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    pin: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export default mongoose.model("FamilyGroup", familyGroupSchema);
