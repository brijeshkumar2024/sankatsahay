import express from "express";
import SOSAlert from "../models/SOSAlert.js";
import Volunteer from "../models/Volunteer.js";
import User from "../models/User.js";
import DisasterZone from "../models/DisasterZone.js";
import Shelter from "../models/Shelter.js";
import SensorPing from "../models/SensorPing.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getRecentAIDecisions } from "../services/aiDecisionService.js";

const router = express.Router();

router.get("/stats", requireAuth, requireRole("admin"), async (_req, res) => {
  const [activeSOS, deployedVolunteers, familiesReunited, resourcesPredicted] = await Promise.all([
    SOSAlert.countDocuments({ status: "active" }),
    Volunteer.countDocuments({ availability: false }),
    User.countDocuments({ status: "FOUND" }),
    DisasterZone.countDocuments({ "aiPrediction.generatedAt": { $exists: true } })
  ]);

  res.json({ activeSOS, deployedVolunteers, familiesReunited, resourcesPredicted });
});

router.get("/dashboard-data", requireAuth, requireRole("admin"), async (_req, res) => {
  const [alerts, volunteers, zones, shelters, sensors, users] = await Promise.all([
    SOSAlert.find().sort({ createdAt: -1 }).limit(100),
    Volunteer.find().populate("userId"),
    DisasterZone.find().sort({ updatedAt: -1 }),
    Shelter.find().limit(100),
    SensorPing.find().sort({ createdAt: -1 }).limit(100),
    User.find().limit(200)
  ]);
  res.json({ alerts, volunteers, zones, shelters, sensors, users });
});

router.get("/ai-decisions", requireAuth, async (req, res) => {
  const limit = Number(req.query.limit || 5);
  const decisions = await getRecentAIDecisions(limit);
  res.json(
    decisions.map((d) => ({
      id: d._id,
      decisionType: d.decisionType,
      timestamp: d.createdAt,
      confidence: d.confidence,
      explanation: d.explanation
    }))
  );
});

export default router;
