import express from "express";
import {
  analyzeTrafficRoute,
  chatWithBot,
  explainDecision,
  predictResources,
  streamVolunteerGuidance
} from "../services/geminiService.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/chat", requireAuth, async (req, res) => {
  const { message, language = "English", context = "" } = req.body;
  const reply = await chatWithBot(message, language, context);

  res.json({ reply });
});

router.post("/predict-resources", requireAuth, async (req, res) => {
  const prediction = await predictResources(req.body.zoneData || {});
  res.json({ prediction });
});

router.get("/explain", requireAuth, async (req, res) => {
  const { type = "general", id = "", data = "{}" } = req.query;
  let parsed = {};
  try {
    parsed = JSON.parse(String(data));
  } catch {
    parsed = { id };
  }
  const explanation = await explainDecision(type, parsed);
  res.json({ explanation });
});

router.post("/explain", requireAuth, async (req, res) => {
  const { decisionType = "general", decisionData = {} } = req.body;
  const explanation = await explainDecision(decisionType, decisionData);
  res.json({ explanation });
});

router.post("/traffic-route", requireAuth, async (req, res) => {
  const { zoneCoords = [], disasterType = "Flood" } = req.body;
  const routes = await analyzeTrafficRoute(zoneCoords, disasterType);
  res.json({ routes });
});

router.post("/volunteer-guidance/stream", requireAuth, async (req, res) => {
  await streamVolunteerGuidance(req.body.taskData || {}, res);
});

export default router;
