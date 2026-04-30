import express from "express";
import FamilyGroup from "../models/FamilyGroup.js";
import User from "../models/User.js";
import { extractDescriptorFromBase64, matchFaceDescriptor } from "../services/faceMatchService.js";

const router = express.Router();

router.get("/dashboard/:pin", async (req, res) => {
  const family = await FamilyGroup.findOne({ pin: req.params.pin }).populate("members");
  if (!family) return res.status(404).json({ message: "Family not found" });
  return res.json(family);
});

router.get("/group/:pin", async (req, res) => {
  const family = await FamilyGroup.findOne({ pin: req.params.pin }).populate("members");
  if (!family) return res.status(404).json({ message: "Family not found" });
  return res.json(family);
});

router.post("/face-match", async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return res.status(400).json({ message: "imageBase64 is required" });
  }

  const inputDescriptor = await extractDescriptorFromBase64(imageBase64);
  if (!inputDescriptor) {
    return res.status(422).json({ message: "No face descriptor could be extracted from image" });
  }

  const users = await User.find({ faceDescriptor: { $exists: true, $ne: [] } }).select("name photoUrl familyPin faceDescriptor");
  const candidates = users.map((u) => ({
    userId: u._id,
    descriptor: u.faceDescriptor,
    name: u.name,
    photo: u.photoUrl,
    familyPin: u.familyPin
  }));

  const matches = matchFaceDescriptor(inputDescriptor, candidates)
    .filter((m) => m.distance < 0.6)
    .slice(0, 3)
    .map((m) => ({
      userId: m.userId,
      name: m.name,
      photo: m.photo,
      familyPin: m.familyPin,
      distance: Number(m.distance.toFixed(4)),
      confidence: Math.round((1 - m.distance) * 100)
    }));

  return res.json({ matches });
});

router.patch("/status/:userId", async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.userId, { status: req.body.status }, { new: true });
  req.app.get("io").to(`family:${user.familyPin}`).emit("family:status-update", user);
  return res.json(user);
});

router.patch("/status", async (req, res) => {
  const { userId, status } = req.body;
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  req.app.get("io").to(`family:${user.familyPin}`).emit("family:status-update", user);
  return res.json(user);
});

export default router;
