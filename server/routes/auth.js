import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, familyPin: user.familyPin },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  return res.json({ token, user });
});

router.post("/register", async (req, res) => {
  const { name, email, password, familyPin, role = "user", faceDescriptor = [], photoUrl, preferredLanguage } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash,
    familyPin,
    role,
    photoUrl,
    faceDescriptor: Array.isArray(faceDescriptor) ? faceDescriptor.slice(0, 128) : [],
    ...(preferredLanguage ? { preferredLanguage } : {})
  });
  return res.status(201).json(user);
});

export default router;
