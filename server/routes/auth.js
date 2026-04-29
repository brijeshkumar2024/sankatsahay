import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Admin credentials with required defaults.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sankatsahay.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "NEXORA2025";

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

// Dedicated admin login endpoint with hardcoded credential fall-back
router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  // Direct hardcoded verification for the required admin account
  if (email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!user) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      user = await User.create({
        name: "System Administrator",
        email: ADMIN_EMAIL.toLowerCase(),
        password: hash,
        role: "admin",
        preferredLanguage: "en",
        status: "SAFE"
      });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  }
  return res.status(401).json({ message: "Invalid admin credentials" });
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
