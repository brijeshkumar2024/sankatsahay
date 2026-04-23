import express from "express";
import Task from "../models/Task.js";
import Volunteer from "../models/Volunteer.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET all open tasks
router.get("/", async (_req, res) => {
  try {
    const tasks = await Task.find({ status: "open" })
      .populate("assignedVolunteer", "name phone trustScore")
      .sort({ priority: -1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tasks assigned to a volunteer
router.get("/my-tasks/:volunteerId", async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedVolunteer: req.params.volunteerId,
      status: { $in: ["assigned", "in_progress"] },
    });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET volunteer profile + completed tasks
router.get("/profile/:volunteerId", async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.volunteerId);
    if (!volunteer) return res.status(404).json({ error: "Volunteer not found" });
    const completedTasks = await Task.find({
      assignedVolunteer: req.params.volunteerId,
      status: { $in: ["completed", "verified"] },
    })
      .sort({ completedAt: -1 })
      .limit(10);
    res.json({ volunteer, completedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST register as volunteer (no auth required — open registration)
router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, skills, address, language, lat, lng } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Name and phone are required" });

    const existing = await Volunteer.findOne({ phone });
    if (existing) return res.status(400).json({ error: "Phone already registered", volunteerId: existing._id });

    const volunteer = await Volunteer.create({
      name,
      phone,
      email,
      skills: skills || [],
      language: language || "hi",
      location: {
        type: "Point",
        coordinates: [Number(lng) || 85.8245, Number(lat) || 20.2961],
        address: address || "",
      },
    });

    res.json({ volunteer, message: "Registered successfully as volunteer!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST accept a task
router.post("/:taskId/accept", async (req, res) => {
  try {
    const { volunteerId } = req.body;
    if (!volunteerId) return res.status(400).json({ error: "volunteerId required" });

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: "assigned", assignedVolunteer: volunteerId },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    await Volunteer.findByIdAndUpdate(volunteerId, {
      availability: "assigned",
      currentTask: task._id,
    });

    req.app.get("io")?.emit("task:assigned", { task, volunteerId });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark task in progress
router.post("/:taskId/start", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: "in_progress" },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    req.app.get("io")?.emit("task:started", { taskId: task._id });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark task completed
router.post("/:taskId/complete", async (req, res) => {
  try {
    const { volunteerId, lat, lng, survivorCount, notes } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      {
        status: "completed",
        completedAt: new Date(),
        gpsProof: { lat: Number(lat) || 20.2961, lng: Number(lng) || 85.8245, timestamp: new Date() },
        survivorCount: Number(survivorCount) || 0,
        notes,
      },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    await Volunteer.findByIdAndUpdate(volunteerId, {
      availability: "available",
      currentTask: null,
      $inc: {
        totalTasksCompleted: 1,
        credits: task.rewardCredits,
        trustScore: 5,
      },
    });

    req.app.get("io")?.emit("task:completed", { task, volunteerId, survivorCount });
    res.json({ task, message: "Task completed. Credits awarded." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST mark rescued (3x credits)
router.post("/:taskId/rescued", async (req, res) => {
  try {
    const { volunteerId, survivorCount, lat, lng } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      {
        status: "completed",
        survivorCount: Number(survivorCount) || 0,
        gpsProof: { lat: Number(lat) || 20.2961, lng: Number(lng) || 85.8245, timestamp: new Date() },
        completedAt: new Date(),
        victimConfirmed: true,
      },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    await Volunteer.findByIdAndUpdate(volunteerId, {
      $inc: {
        credits: task.rewardCredits * 3,
        trustScore: 15,
        totalTasksCompleted: 1,
      },
      availability: "available",
      currentTask: null,
    });

    req.app.get("io")?.emit("survivor:rescued", { taskId: task._id, survivorCount, location: { lat, lng } });
    req.app.get("io")?.emit("task:completed", { task, volunteerId });

    res.json({ task, message: `${survivorCount} survivor(s) rescued! Bonus credits awarded.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
