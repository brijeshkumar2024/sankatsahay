import express from "express";
import SOSAlert from "../models/SOSAlert.js";
import Volunteer from "../models/Volunteer.js";
import User from "../models/User.js";
import DisasterZone from "../models/DisasterZone.js";
import Shelter from "../models/Shelter.js";
import SensorPing from "../models/SensorPing.js";
import Task from "../models/Task.js";
import { getRecentAIDecisions, logAIDecision } from "../services/aiDecisionService.js";
import { simulationEngine } from "../services/simulationEngine.js";
import { explainDecision } from "../services/geminiService.js";

const router = express.Router();

// ── Stats ────────────────────────────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  const [activeSOS, deployedVolunteers, familiesReunited, resourcesPredicted, totalVolunteers, totalShelters, totalTasks] = await Promise.all([
    SOSAlert.countDocuments({ status: "active" }),
    Volunteer.countDocuments({ availability: { $in: [false, "assigned", "busy"] } }),
    User.countDocuments({ status: "FOUND" }),
    DisasterZone.countDocuments({ "aiPrediction.generatedAt": { $exists: true } }),
    Volunteer.countDocuments(),
    Shelter.countDocuments(),
    Task.countDocuments({ status: { $in: ["assigned", "in_progress"] } })
  ]);

  res.json({ activeSOS, deployedVolunteers, familiesReunited, resourcesPredicted, totalVolunteers, totalShelters, totalTasks });
});

// ── Dashboard Master Data ────────────────────────────────────────────────────
router.get("/dashboard-data", async (_req, res) => {
  const [alerts, volunteers, zones, shelters, sensors, users, tasks] = await Promise.all([
    SOSAlert.find().sort({ createdAt: -1 }).limit(200),
    Volunteer.find().populate("userId"),
    DisasterZone.find().sort({ updatedAt: -1 }),
    Shelter.find().limit(200),
    SensorPing.find().sort({ createdAt: -1 }).limit(200),
    User.find().limit(200),
    Task.find().sort({ createdAt: -1 }).limit(200)
  ]);
  res.json({ alerts, volunteers, zones, shelters, sensors, users, tasks });
});

// ── AI Decisions ─────────────────────────────────────────────────────────────
router.get("/ai-decisions", async (req, res) => {
  const limit = Number(req.query.limit || 20);
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

router.post("/ai-decisions/explain", async (req, res) => {
  const { decisionType, data } = req.body;
  const explanation = await explainDecision(decisionType || "general", data || {});
  await logAIDecision({ decisionType: decisionType || "other", confidence: data?.confidence || 70, explanation, payload: data });
  res.json({ explanation });
});

// ── SOS Management ───────────────────────────────────────────────────────────
router.get("/sos", async (_req, res) => {
  const alerts = await SOSAlert.find().sort({ createdAt: -1 }).limit(500);
  res.json(alerts);
});

router.patch("/sos/:id/priority", async (req, res) => {
  const { priority } = req.body;
  const alert = await SOSAlert.findByIdAndUpdate(
    req.params.id,
    { priority, updatedAt: new Date() },
    { new: true }
  );
  if (!alert) return res.status(404).json({ message: "SOS alert not found" });
  req.app.get("io")?.to("admin-room").emit("sos:updated", alert);
  res.json(alert);
});

router.patch("/sos/:id/status", async (req, res) => {
  const { status } = req.body;
  const alert = await SOSAlert.findByIdAndUpdate(
    req.params.id,
    { status, updatedAt: new Date() },
    { new: true }
  );
  if (!alert) return res.status(404).json({ message: "SOS alert not found" });
  req.app.get("io")?.to("admin-room").emit("sos:updated", alert);
  res.json(alert);
});

router.delete("/sos/:id", async (req, res) => {
  const alert = await SOSAlert.findByIdAndDelete(req.params.id);
  if (!alert) return res.status(404).json({ message: "SOS alert not found" });
  req.app.get("io")?.to("admin-room").emit("sos:deleted", { id: req.params.id });
  res.json({ message: "SOS alert deleted" });
});

// ── Volunteer Management ─────────────────────────────────────────────────────
router.get("/volunteers", async (_req, res) => {
  const volunteers = await Volunteer.find().populate("userId").sort({ createdAt: -1 }).limit(500);
  res.json(volunteers);
});

router.patch("/volunteers/:id/assign", async (req, res) => {
  const { taskId } = req.body;
  const volunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    { availability: "assigned", currentTask: taskId, updatedAt: new Date() },
    { new: true }
  );
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });
  req.app.get("io")?.to("admin-room").emit("volunteer:updated", volunteer);
  res.json(volunteer);
});

router.patch("/volunteers/:id/reassign", async (req, res) => {
  const volunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    { availability: "available", currentTask: null, updatedAt: new Date() },
    { new: true }
  );
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });
  req.app.get("io")?.to("admin-room").emit("volunteer:updated", volunteer);
  res.json(volunteer);
});

router.patch("/volunteers/:id/status", async (req, res) => {
  const { status } = req.body;
  const volunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    { availability: status, updatedAt: new Date() },
    { new: true }
  );
  if (!volunteer) return res.status(404).json({ message: "Volunteer not found" });
  req.app.get("io")?.to("admin-room").emit("volunteer:updated", volunteer);
  res.json(volunteer);
});

// ── Cyclone / Simulation State ───────────────────────────────────────────────
router.get("/cyclone/state", async (_req, res) => {
  const state = simulationEngine.snapshot();
  const zones = state.zones || [];
  res.json({
    phase: state.phase,
    severity: state.severity,
    intensity: state.intensity,
    floodLevel: state.floodLevel,
    panicIndex: state.panicIndex,
    simMode: state.simMode,
    activeZone: state.activeZone,
    zones,
    broadcast: state.broadcast,
    timestamp: state.timestamp
  });
});

router.post("/cyclone/trigger-alert", async (req, res) => {
  const { message, severity = "CRITICAL", zoneId } = req.body;
  simulationEngine.state.broadcast = message || "Admin triggered cyclone alert.";
  simulationEngine.state.severity = severity;
  if (zoneId) simulationEngine.state.activeZone = zoneId;
  simulationEngine.updateTimestamp();
  simulationEngine.emitAll("admin:alert:triggered", { message, severity, zoneId });
  res.json({ message: "Alert triggered", broadcast: simulationEngine.state.broadcast });
});

// ── Analytics / Heatmap ──────────────────────────────────────────────────────
router.get("/analytics/heatmap", async (_req, res) => {
  const sosAlerts = await SOSAlert.find({ status: "active" }).select("location.coordinates disasterType createdAt").limit(1000);
  const incidents = sosAlerts.map((a) => ({
    type: a.disasterType || "Unknown",
    coords: a.location?.coordinates || [85.8245, 20.2961],
    timestamp: a.createdAt
  }));
  // Simple hourly aggregation
  const hourly = {};
  incidents.forEach((i) => {
    const h = new Date(i.timestamp).getHours();
    hourly[h] = (hourly[h] || 0) + 1;
  });
  res.json({ incidents, hourlyAggregation: hourly, total: incidents.length });
});

router.get("/analytics/resource-demand", async (_req, res) => {
  const zones = await DisasterZone.find().sort({ updatedAt: -1 }).limit(50);
  const predictions = zones.map((z) => ({
    zone: z.name,
    severity: z.severity,
    aiPrediction: z.aiPrediction || null,
    disasterType: z.disasterType
  }));
  // Compute predicted shortages
  const foodNeeded = predictions.reduce((sum, p) => sum + (p.aiPrediction?.foodParcels || 0), 0);
  const medicalNeeded = predictions.reduce((sum, p) => sum + (p.aiPrediction?.medicalKits || 0), 0);
  const waterNeeded = predictions.reduce((sum, p) => sum + (p.aiPrediction?.waterLiters || 0), 0);
  res.json({ predictions, totals: { foodNeeded, medicalNeeded, waterNeeded } });
});

export default router;
